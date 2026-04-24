import { randomBytes } from 'crypto';

import type { PrismaClient } from '@prisma/client';

import { toDisplay } from '../schemas/status.js';
import type { DisplayShipmentStatus } from '../schemas/status.js';

export class ShareError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
  }
}

export interface ShareLinkOutput {
  token: string;
  expiresAt: string;
  url: string;
}

export interface CreateShareLinkInput {
  shipmentId: string;
  userId: string;
  ttlDays?: number;
}

function generateToken(): string {
  // 24 bytes → 32 base64url chars
  return randomBytes(24).toString('base64url');
}

function publicBaseUrl(): string {
  return process.env['PUBLIC_BASE_URL'] ?? 'http://localhost:3000';
}

export async function createShareLink(
  prisma: PrismaClient,
  input: CreateShareLinkInput
): Promise<ShareLinkOutput> {
  const ttl = Math.min(Math.max(input.ttlDays ?? 7, 1), 30);
  const shipment = await prisma.shipment.findUnique({
    where: { id: input.shipmentId },
  });
  if (!shipment) throw new ShareError('Shipment not found', 404, 'NOT_FOUND');
  if (shipment.userId !== input.userId) {
    throw new ShareError('Forbidden', 403, 'FORBIDDEN');
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000);
  await prisma.shareLink.create({
    data: {
      token,
      shipmentId: shipment.id,
      expiresAt,
    },
  });
  return {
    token,
    expiresAt: expiresAt.toISOString(),
    url: `${publicBaseUrl()}/share/${token}`,
  };
}

export interface PublicShipmentView {
  carrier: { code: string; displayName: string };
  trackingNumber: string;
  status: DisplayShipmentStatus;
  eta: string | null;
  recentEvents: Array<{
    id: string;
    shipmentId: string;
    occurredAt: string;
    status: DisplayShipmentStatus;
    description: string;
    location: string | null;
  }>;
}

type ShareRow = {
  token: string;
  shipmentId: string;
  expiresAt: Date;
  shipment?: {
    id: string;
    trackingNumber: string;
    status:
      | 'PENDING'
      | 'IN_TRANSIT'
      | 'OUT_FOR_DELIVERY'
      | 'DELIVERED'
      | 'EXCEPTION'
      | 'RETURNED'
      | 'UNKNOWN';
    eta: Date | null;
    carrier?: { code: string; displayName: string } | null;
    events?: Array<{
      id: string;
      shipmentId: string;
      occurredAt: Date;
      status:
        | 'PENDING'
        | 'IN_TRANSIT'
        | 'OUT_FOR_DELIVERY'
        | 'DELIVERED'
        | 'EXCEPTION'
        | 'RETURNED'
        | 'UNKNOWN';
      description: string;
      location: string | null;
    }>;
  } | null;
};

export async function getPublicShipmentView(
  prisma: PrismaClient,
  token: string
): Promise<PublicShipmentView> {
  const row = (await prisma.shareLink.findUnique({
    where: { token },
    include: {
      shipment: { include: { carrier: true, events: true } },
    },
  })) as ShareRow | null;
  if (!row) throw new ShareError('Share link not found', 404, 'NOT_FOUND');
  if (row.expiresAt.getTime() < Date.now()) {
    throw new ShareError('Share link expired', 410, 'GONE');
  }
  if (!row.shipment) throw new ShareError('Shipment not found', 404, 'NOT_FOUND');

  const shipment = row.shipment;
  const events = (shipment.events ?? [])
    .slice()
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      shipmentId: e.shipmentId,
      occurredAt: e.occurredAt.toISOString(),
      status: toDisplay(e.status) as DisplayShipmentStatus,
      description: e.description,
      location: e.location ?? null,
    }));

  return {
    carrier: {
      code: shipment.carrier?.code ?? 'UNKNOWN',
      displayName: shipment.carrier?.displayName ?? 'Unknown',
    },
    trackingNumber: shipment.trackingNumber,
    status: toDisplay(shipment.status) as DisplayShipmentStatus,
    eta: shipment.eta ? shipment.eta.toISOString() : null,
    recentEvents: events,
  };
}
