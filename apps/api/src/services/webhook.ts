import { createHmac, timingSafeEqual } from 'crypto';

import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

import { getCopyForTransition } from '../content/notifications.js';
import { broadcastShipmentUpdate } from '../realtime/broadcast.js';
import { toDisplay } from '../schemas/status.js';
import type { DisplayShipmentStatus } from '../schemas/status.js';

import { getEasyPostAdapter } from './easypost/adapter.js';
import { mapEasyPostStatus } from './easypost/statusMap.js';
import { enqueuePushNotification } from './push.js';
import { ShipmentsService } from './shipments.js';




/**
 * Verifies the HMAC-SHA256 signature in the EasyPost-style header.
 * Signature format: `hmac-sha256-hex=<hex>`.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string = process.env['EASYPOST_WEBHOOK_SECRET'] ?? ''
): boolean {
  if (!signatureHeader) return false;
  if (!secret) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('EASYPOST_WEBHOOK_SECRET not configured');
    }
    return false;
  }
  const expected = 'hmac-sha256-hex=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type WebhookOutcome = 'accepted' | 'duplicate' | 'bad_signature';

export interface ProcessedWebhook {
  outcome: WebhookOutcome;
  shipmentId?: string;
  providerEventId: string;
}

export interface ProcessWebhookContext {
  app: FastifyInstance;
  rawBody: string;
  signature?: string;
  secret?: string;
}

/**
 * Tracks consecutive webhook processing failures; mirrors the adapter
 * breaker but scoped to webhook ingestion.
 */
const webhookBreaker = {
  failures: 0,
  openedAt: null as number | null,
  threshold: 5,
  cooldownMs: 30_000,
  get isOpen(): boolean {
    if (this.openedAt === null) return false;
    if (Date.now() - this.openedAt > this.cooldownMs) {
      this.reset();
      return false;
    }
    return true;
  },
  fail(): void {
    this.failures += 1;
    if (this.failures >= this.threshold) this.openedAt = Date.now();
  },
  success(): void {
    this.failures = 0;
    this.openedAt = null;
  },
  reset(): void {
    this.failures = 0;
    this.openedAt = null;
  },
};

export function getWebhookBreakerState(): { open: boolean; failures: number } {
  return { open: webhookBreaker.isOpen, failures: webhookBreaker.failures };
}

export function resetWebhookBreaker(): void {
  webhookBreaker.reset();
}

interface EasyPostWebhookBody {
  id?: string;
  description?: string;
  result?: {
    id?: string;
    tracking_code?: string;
    status?: string;
    carrier?: string;
    est_delivery_date?: string | null;
    updated_at?: string | null;
    tracking_details?: Array<{
      datetime?: string;
      status?: string;
      message?: string;
      tracking_location?: { city?: string; state?: string } | null;
    }>;
  };
}

export async function processWebhookEvent(
  ctx: ProcessWebhookContext
): Promise<ProcessedWebhook> {
  const { app, rawBody, signature, secret } = ctx;

  const ok = verifyWebhookSignature(rawBody, signature, secret);
  if (!ok) {
    return { outcome: 'bad_signature', providerEventId: 'unknown' };
  }

  let body: EasyPostWebhookBody;
  try {
    body = JSON.parse(rawBody) as EasyPostWebhookBody;
  } catch {
    return { outcome: 'bad_signature', providerEventId: 'unknown' };
  }

  const providerEventId = body.id ?? body.result?.id ?? `evt_${Date.now()}`;
  const trackingCode = body.result?.tracking_code ?? '';
  const prisma = (app as unknown as { prisma: PrismaClient }).prisma;

  // Determine carrier row first; default to the carrier string on the body
  const carrierCode = (body.result?.carrier ?? 'USPS').toUpperCase();
  const carrier = await prisma.carrier.upsert({
    where: { code: carrierCode },
    create: {
      id: carrierCode,
      code: carrierCode,
      name: carrierCode,
      displayName: carrierCode,
    },
    update: {},
  });

  // Idempotency check
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: {
      carrierId_providerEventId: {
        carrierId: carrier.id,
        providerEventId,
      },
    },
  });
  if (existingEvent) {
    return { outcome: 'duplicate', providerEventId };
  }

  if (!trackingCode) {
    await prisma.webhookEvent.create({
      data: {
        carrierId: carrier.id,
        providerEventId,
        signatureValid: true,
        processedAt: new Date(),
        rawPayload: body as unknown as object,
      },
    });
    webhookBreaker.success();
    return { outcome: 'accepted', providerEventId };
  }
  const shipmentLookup = await prisma.shipment.findUnique({
    where: {
      trackingNumber_carrierId: {
        trackingNumber: trackingCode,
        carrierId: carrier.id,
      },
    },
  });
  if (!shipmentLookup) {
    await prisma.webhookEvent.create({
      data: {
        carrierId: carrier.id,
        providerEventId,
        signatureValid: true,
        processedAt: new Date(),
        rawPayload: body as unknown as object,
      },
    });
    webhookBreaker.success();
    return { outcome: 'accepted', providerEventId };
  }

  const newStatus = mapEasyPostStatus(body.result?.status);
  const before = shipmentLookup.status;
  const eta = body.result?.est_delivery_date
    ? new Date(body.result.est_delivery_date)
    : shipmentLookup.eta;
  const trackingDetails = body.result?.tracking_details ?? [];

  // Persist webhook event, shipment update, and tracking events atomically.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.webhookEvent.create({
      data: {
        carrierId: carrier.id,
        providerEventId,
        signatureValid: true,
        processedAt: new Date(),
        rawPayload: body as unknown as object,
      },
    });
    const shipmentUpdate = await tx.shipment.update({
      where: { id: shipmentLookup.id },
      data: {
        status: newStatus,
        eta,
        lastEventAt: new Date(),
      },
      include: { carrier: true },
    });
    for (const d of trackingDetails) {
      await tx.trackingEvent.create({
        data: {
          shipmentId: shipmentLookup.id,
          occurredAt: d.datetime ? new Date(d.datetime) : new Date(),
          status: mapEasyPostStatus(d.status),
          description: d.message ?? '',
          location: [d.tracking_location?.city, d.tracking_location?.state]
            .filter(Boolean)
            .join(', ') || null,
          rawEvent: d as unknown as object,
        },
      });
    }
    return shipmentUpdate;
  });
  const shipment = shipmentLookup;

  // Push broadcast + notification
  const svc = new ShipmentsService(prisma, getEasyPostAdapter());
  try {
    const detail = await svc.getShipment(shipment.id, shipment.userId);
    await broadcastShipmentUpdate(app, shipment.userId, detail);
    if (before !== newStatus) {
      const copy = getCopyForTransition(
        toDisplay(before) as DisplayShipmentStatus,
        toDisplay(newStatus) as DisplayShipmentStatus,
        { eta }
      );
      await enqueuePushNotification(prisma, {
        userId: shipment.userId,
        shipmentId: shipment.id,
        type:
          copy.kind === 'DELIVERED'
            ? 'DELIVERED'
            : copy.kind === 'DELAY'
              ? 'DELAY'
              : copy.kind === 'EXCEPTION'
                ? 'EXCEPTION'
                : 'STATUS_CHANGE',
        title: copy.title,
        body: copy.body,
      });
    }
  } catch {
    webhookBreaker.fail();
  }

  webhookBreaker.success();
  return { outcome: 'accepted', providerEventId, shipmentId: updated.id };
}
