import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getMockPublicKey } from '../../tests/fixtures/clerk.js';
import { createPrismaMock, type MockPrisma } from '../../tests/fixtures/prismaMock.js';
import { signWebhook, DEFAULT_WEBHOOK_SECRET } from '../../tests/fixtures/webhook-hmac.js';
import { resetWebhookBreaker } from '../services/webhook.js';

vi.mock('../db/client.js', () => ({
  prisma: createPrismaMock(),
}));

async function buildAppForTest(prisma: MockPrisma): Promise<FastifyInstance> {
  const publicKey = await getMockPublicKey();
  const { buildApp } = await import('../app.js');
  return buildApp({
    prisma: prisma as unknown as PrismaClient,
    auth: { mockMode: true, publicKey },
  });
}

function seededPrisma(): MockPrisma {
  const p = createPrismaMock();
  p._tables.users.rows.push({
    id: 'user_1',
    clerkId: 'clerk_1',
    email: 'a@b.com',
  });
  p._tables.carriers.rows.push({
    id: 'USPS',
    code: 'USPS',
    name: 'USPS',
    displayName: 'USPS',
  });
  p._tables.shipments.rows.push({
    id: 'ship_1',
    userId: 'user_1',
    carrierId: 'USPS',
    trackingNumber: 'WEB1000000001',
    nickname: null,
    status: 'PENDING',
    lastEventAt: null,
    eta: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return p;
}

describe('webhook /v1/webhooks/easypost', () => {
  let app: FastifyInstance;
  let prisma: MockPrisma;

  beforeEach(async () => {
    resetWebhookBreaker();
    prisma = seededPrisma();
    app = await buildAppForTest(prisma);
  });

  afterEach(async () => {
    await app.close();
  });

  it('bad signature → 400', async () => {
    const payload = JSON.stringify({ id: 'evt1', description: 't' });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/easypost',
      headers: {
        'content-type': 'application/json',
        'x-hmac-signature': 'hmac-sha256-hex=deadbeef',
      },
      payload,
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('BAD_SIGNATURE');
  });

  it('valid signature → 202, updates shipment and adds tracking event', async () => {
    const payload = JSON.stringify({
      id: 'evt_web_1',
      description: 'tracker.updated',
      result: {
        id: 'trk_1',
        tracking_code: 'WEB1000000001',
        status: 'out_for_delivery',
        carrier: 'USPS',
        est_delivery_date: '2025-01-01T00:00:00Z',
        tracking_details: [
          {
            datetime: '2024-12-31T12:00:00Z',
            status: 'out_for_delivery',
            message: 'Out for delivery',
            tracking_location: { city: 'NYC', state: 'NY' },
          },
        ],
      },
    });
    const sig = signWebhook(payload, DEFAULT_WEBHOOK_SECRET);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/easypost',
      headers: {
        'content-type': 'application/json',
        'x-hmac-signature': sig,
      },
      payload,
    });
    expect(res.statusCode).toBe(202);

    const shipment = await prisma.shipment.findUnique({ where: { id: 'ship_1' } });
    expect(shipment?.status).toBe('OUT_FOR_DELIVERY');

    const events = await prisma.trackingEvent.findMany({ where: { shipmentId: 'ship_1' } });
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('duplicate providerEventId → 409', async () => {
    const payload = JSON.stringify({
      id: 'evt_dup',
      description: 'tracker.updated',
      result: {
        id: 'trk_x',
        tracking_code: 'WEB1000000001',
        status: 'in_transit',
        carrier: 'USPS',
        tracking_details: [],
      },
    });
    const sig = signWebhook(payload, DEFAULT_WEBHOOK_SECRET);
    const first = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/easypost',
      headers: { 'content-type': 'application/json', 'x-hmac-signature': sig },
      payload,
    });
    expect(first.statusCode).toBe(202);
    const second = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/easypost',
      headers: { 'content-type': 'application/json', 'x-hmac-signature': sig },
      payload,
    });
    expect(second.statusCode).toBe(409);
  });

  it('unknown status maps to UNKNOWN internal', async () => {
    const payload = JSON.stringify({
      id: 'evt_unk',
      description: 'tracker.updated',
      result: {
        id: 'trk_u',
        tracking_code: 'WEB1000000001',
        status: 'wat_is_this',
        carrier: 'USPS',
        tracking_details: [],
      },
    });
    const sig = signWebhook(payload, DEFAULT_WEBHOOK_SECRET);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/easypost',
      headers: { 'content-type': 'application/json', 'x-hmac-signature': sig },
      payload,
    });
    expect(res.statusCode).toBe(202);
    const shipment = await prisma.shipment.findUnique({ where: { id: 'ship_1' } });
    expect(shipment?.status).toBe('UNKNOWN');
  });

  it('unknown shipment → 202 (accepted but no-op)', async () => {
    const payload = JSON.stringify({
      id: 'evt_no_ship',
      description: 'tracker.updated',
      result: {
        id: 'trk_q',
        tracking_code: 'NO_MATCH_TRACK',
        status: 'in_transit',
        carrier: 'USPS',
        tracking_details: [],
      },
    });
    const sig = signWebhook(payload, DEFAULT_WEBHOOK_SECRET);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/easypost',
      headers: { 'content-type': 'application/json', 'x-hmac-signature': sig },
      payload,
    });
    expect(res.statusCode).toBe(202);
  });
});
