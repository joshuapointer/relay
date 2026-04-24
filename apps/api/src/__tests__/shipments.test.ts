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

async function authHeaders(userId = 'clerk_alice', email = 'alice@relay.test'): Promise<{ authorization: string }> {
  const token = await signClerkJwt({ userId, email });
  return { authorization: `Bearer ${token}` };
}

describe('shipments routes', () => {
  let app: FastifyInstance;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    // Reset default adapter — each test gets fresh MSW state
    setEasyPostAdapter(new EasyPostAdapter(''));
    app = await buildAppForTest(prisma);
  });

  afterEach(async () => {
    await app.close();
    setEasyPostAdapter(null);
  });

  it('POST /v1/shipments without auth → 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      payload: { trackingNumber: 'EZ1000000001' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /v1/shipments creates a shipment with 201', async () => {
    const headers = await authHeaders();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: 'EZ1000000001', carrierCode: 'USPS' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; status: string; trackingNumber: string; events: unknown[] }>();
    expect(body.id).toBeTruthy();
    expect(body.trackingNumber).toBe('EZ1000000001');
    expect(['Pending', 'In Transit', 'Out for Delivery', 'Delivered', 'Exception']).toContain(
      body.status
    );
    expect(Array.isArray(body.events)).toBe(true);
  });

  it('GET /v1/shipments lists only the caller-owned rows', async () => {
    const headers = await authHeaders();
    await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: 'EZ1000000002', carrierCode: 'USPS' },
    });
    const res = await app.inject({ method: 'GET', url: '/v1/shipments', headers });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ items: Array<{ id: string }> }>();
    expect(body.items.length).toBe(1);
  });

  it('GET /v1/shipments/:id → 200 for owner, 403 for non-owner, 404 for unknown', async () => {
    const ownerHeaders = await authHeaders('clerk_owner', 'owner@relay.test');
    const create = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers: ownerHeaders,
      payload: { trackingNumber: 'EZ1000000003', carrierCode: 'USPS' },
    });
    const created = create.json<{ id: string }>();

    const getOwner = await app.inject({
      method: 'GET',
      url: `/v1/shipments/${created.id}`,
      headers: ownerHeaders,
    });
    expect(getOwner.statusCode).toBe(200);

    const otherHeaders = await authHeaders('clerk_other', 'other@relay.test');
    const getOther = await app.inject({
      method: 'GET',
      url: `/v1/shipments/${created.id}`,
      headers: otherHeaders,
    });
    expect(getOther.statusCode).toBe(403);

    const getMissing = await app.inject({
      method: 'GET',
      url: `/v1/shipments/does-not-exist`,
      headers: ownerHeaders,
    });
    expect(getMissing.statusCode).toBe(404);
  });

  it('PATCH /v1/shipments/:id updates nickname', async () => {
    const headers = await authHeaders();
    const create = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: 'EZ1000000004', carrierCode: 'USPS' },
    });
    const created = create.json<{ id: string }>();
    const patch = await app.inject({
      method: 'PATCH',
      url: `/v1/shipments/${created.id}`,
      headers,
      payload: { nickname: 'Birthday gift' },
    });
    expect(patch.statusCode).toBe(200);
    const body = patch.json<{ nickname: string }>();
    expect(body.nickname).toBe('Birthday gift');
  });

  it('DELETE /v1/shipments/:id → 204', async () => {
    const headers = await authHeaders();
    const create = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: 'EZ1000000005', carrierCode: 'USPS' },
    });
    const created = create.json<{ id: string }>();
    const del = await app.inject({
      method: 'DELETE',
      url: `/v1/shipments/${created.id}`,
      headers,
    });
    expect(del.statusCode).toBe(204);
    const list = await app.inject({ method: 'GET', url: '/v1/shipments', headers });
    expect(list.json<{ items: unknown[] }>().items.length).toBe(0);
  });

  it('POST /v1/shipments/:id/refresh re-fetches tracker', async () => {
    const headers = await authHeaders();
    const create = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: 'EZ1000000006', carrierCode: 'USPS' },
    });
    const created = create.json<{ id: string }>();
    const refresh = await app.inject({
      method: 'POST',
      url: `/v1/shipments/${created.id}/refresh`,
      headers,
    });
    expect(refresh.statusCode).toBe(200);
  });

  it('GET /v1/shipments?status=In Transit filters', async () => {
    const headers = await authHeaders();
    await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: 'EZ1000000007', carrierCode: 'USPS' },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/shipments?status=In%20Transit',
      headers,
    });
    expect(res.statusCode).toBe(200);
  });

  it('carrier not found maps to 400', async () => {
    const headers = await authHeaders();
    // Install adapter that always fails with CARRIER_NOT_FOUND
    const { EasyPostAdapter: A, AdapterError } = await import('../services/easypost/adapter.js');
    class BadAdapter extends A {
      override async createTracker(): Promise<never> {
        throw new AdapterError('not found', 'CARRIER_NOT_FOUND');
      }
    }
    setEasyPostAdapter(new BadAdapter(''));
    const res = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: 'BAD000000000', carrierCode: 'NOPE' },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('CARRIER_NOT_FOUND');
  });

  it('validates request body with Zod → 400', async () => {
    const headers = await authHeaders();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('response shape matches ShipmentDetail schema', async () => {
    const headers = await authHeaders();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/shipments',
      headers,
      payload: { trackingNumber: 'EZ1000000008', carrierCode: 'USPS' },
    });
    const body = res.json<{
      id: string;
      userId: string;
      carrier: { code: string; displayName: string };
      trackingNumber: string;
      status: string;
      events: unknown[];
    }>();
    expect(body.userId).toBeTruthy();
    expect(body.carrier).toBeTruthy();
    expect(body.carrier.code).toBe('USPS');
    expect(body.trackingNumber).toBe('EZ1000000008');
  });
});
