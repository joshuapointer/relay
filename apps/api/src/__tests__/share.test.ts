import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { signClerkJwt, getMockPublicKey } from '../../tests/fixtures/clerk.js';
import { createPrismaMock, type MockPrisma } from '../../tests/fixtures/prismaMock.js';
import { setEasyPostAdapter, EasyPostAdapter } from '../services/easypost/adapter.js';

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

async function headers(
  userId = 'clerk_share',
  email = 'share@relay.test'
): Promise<{ authorization: string }> {
  const token = await signClerkJwt({ userId, email });
  return { authorization: `Bearer ${token}` };
}

describe('share routes', () => {
  let app: FastifyInstance;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    setEasyPostAdapter(new EasyPostAdapter(''));
    app = await buildAppForTest(prisma);
  });

  afterEach(async () => {
    await app.close();
    setEasyPostAdapter(null);
  });

  async function createShipment(): Promise<{ id: string; h: { authorization: string } }> {
    const h = await headers();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers: h,
      payload: { trackingNumber: 'SHARE0000000001', carrierCode: 'USPS' },
    });
    const body = res.json<{ id: string }>();
    return { id: body.id, h };
  }

  it('POST /v1/shipments/:id/share → 201 with token', async () => {
    const { id, h } = await createShipment();
    const res = await app.inject({
      method: 'POST',
      url: `/v1/shipments/${id}/share`,
      headers: h,
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ token: string; expiresAt: string; url: string }>();
    expect(body.token.length).toBeGreaterThanOrEqual(32);
    expect(body.url).toContain(body.token);
  });

  it('POST /v1/shipments/:id/share without auth → 401', async () => {
    const { id } = await createShipment();
    const res = await app.inject({
      method: 'POST',
      url: `/v1/shipments/${id}/share`,
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /v1/share/:token happy path, no PII', async () => {
    const { id, h } = await createShipment();
    const create = await app.inject({
      method: 'POST',
      url: `/v1/shipments/${id}/share`,
      headers: h,
      payload: {},
    });
    const { token } = create.json<{ token: string }>();
    const res = await app.inject({ method: 'GET', url: `/v1/share/${token}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      carrier: { code: string };
      trackingNumber: string;
      status: string;
      recentEvents: unknown[];
      userId?: string;
      nickname?: string;
    }>();
    expect(body.carrier.code).toBe('USPS');
    expect(body.trackingNumber).toBe('SHARE0000000001');
    expect(body.userId).toBeUndefined();
    expect(body.nickname).toBeUndefined();
    expect(Array.isArray(body.recentEvents)).toBe(true);
  });

  it('GET /v1/share/:token unknown → 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/share/does-not-exist-token',
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /v1/share/:token expired → 410', async () => {
    const { id, h } = await createShipment();
    const create = await app.inject({
      method: 'POST',
      url: `/v1/shipments/${id}/share`,
      headers: h,
      payload: {},
    });
    const { token } = create.json<{ token: string }>();
    // Expire the link in mock store
    const row = prisma._tables.shareLinks.rows.find(
      (r: Record<string, unknown>) => r['token'] === token
    );
    expect(row).toBeTruthy();
    if (row) row['expiresAt'] = new Date(Date.now() - 60_000);
    const res = await app.inject({ method: 'GET', url: `/v1/share/${token}` });
    expect(res.statusCode).toBe(410);
  });

  it('rejects ttlDays > 30 validation', async () => {
    const { id, h } = await createShipment();
    const res = await app.inject({
      method: 'POST',
      url: `/v1/shipments/${id}/share`,
      headers: h,
      payload: { ttlDays: 99 },
    });
    expect(res.statusCode).toBe(400);
  });
});
