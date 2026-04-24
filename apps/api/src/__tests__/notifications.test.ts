import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { signClerkJwt, getMockPublicKey } from '../../tests/fixtures/clerk.js';
import { createPrismaMock, type MockPrisma } from '../../tests/fixtures/prismaMock.js';

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

async function authHeaders(
  userId = 'clerk_alice',
  email = 'alice@relay.test',
): Promise<{ authorization: string }> {
  const token = await signClerkJwt({ userId, email });
  return { authorization: `Bearer ${token}` };
}

async function signIn(
  app: FastifyInstance,
  userId = 'clerk_alice',
  email = 'alice@relay.test',
): Promise<string> {
  // Hit any authenticated endpoint to ensure the user row is provisioned.
  const headers = await authHeaders(userId, email);
  await app.inject({ method: 'GET', url: '/v1/shipments', headers });
  return headers.authorization;
}

describe('notifications routes', () => {
  let app: FastifyInstance;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    app = await buildAppForTest(prisma);
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /v1/notifications without auth → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/notifications' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /v1/notifications returns only the caller-owned rows', async () => {
    const authorization = await signIn(app);
    const userRow = prisma._tables.users.rows[0] as { id: string } | undefined;
    expect(userRow).toBeTruthy();
    const userId = userRow!.id;

    prisma._tables.notifications.rows.push({
      id: 'ntf_1',
      userId,
      shipmentId: null,
      type: 'DELIVERED',
      status: 'SENT',
      title: 'Delivered',
      body: 'Your package arrived.',
      payload: { title: 'Delivered', body: 'Your package arrived.' },
      deliveredAt: new Date(),
      readAt: null,
      createdAt: new Date(),
    });
    prisma._tables.notifications.rows.push({
      id: 'ntf_other',
      userId: 'other-user',
      shipmentId: null,
      type: 'STATUS_CHANGE',
      status: 'SENT',
      title: 'Hidden',
      body: 'Not mine',
      payload: {},
      deliveredAt: new Date(),
      readAt: null,
      createdAt: new Date(),
    });

    const res = await app.inject({
      method: 'GET',
      url: '/v1/notifications',
      headers: { authorization },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ items: Array<{ id: string; title: string }> }>();
    expect(body.items.length).toBe(1);
    expect(body.items[0]?.id).toBe('ntf_1');
  });

  it('POST /v1/notifications/:id/read marks a notification read', async () => {
    const authorization = await signIn(app);
    const userRow = prisma._tables.users.rows[0] as { id: string };
    prisma._tables.notifications.rows.push({
      id: 'ntf_2',
      userId: userRow.id,
      shipmentId: null,
      type: 'STATUS_CHANGE',
      status: 'SENT',
      title: 'Moving',
      body: 'In transit',
      payload: {},
      deliveredAt: new Date(),
      readAt: null,
      createdAt: new Date(),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications/ntf_2/read',
      headers: { authorization },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ readAt: string | null }>();
    expect(body.readAt).not.toBeNull();
  });

  it('POST /v1/notifications/:id/read for non-owned → 404', async () => {
    const authorization = await signIn(app);
    prisma._tables.notifications.rows.push({
      id: 'ntf_other2',
      userId: 'someone-else',
      shipmentId: null,
      type: 'STATUS_CHANGE',
      status: 'SENT',
      title: 't',
      body: 'b',
      payload: {},
      deliveredAt: null,
      readAt: null,
      createdAt: new Date(),
    });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications/ntf_other2/read',
      headers: { authorization },
    });
    expect(res.statusCode).toBe(404);
  });

  it('POST /v1/notifications/read-all marks all unread rows read', async () => {
    const authorization = await signIn(app);
    const userRow = prisma._tables.users.rows[0] as { id: string };
    for (let i = 0; i < 3; i++) {
      prisma._tables.notifications.rows.push({
        id: `ntf_bulk_${i}`,
        userId: userRow.id,
        shipmentId: null,
        type: 'STATUS_CHANGE',
        status: 'SENT',
        title: `T${i}`,
        body: `B${i}`,
        payload: {},
        deliveredAt: null,
        readAt: null,
        createdAt: new Date(),
      });
    }

    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications/read-all',
      headers: { authorization },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ count: number }>();
    expect(body.count).toBe(3);
  });
});

describe('push-tokens routes', () => {
  let app: FastifyInstance;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    app = await buildAppForTest(prisma);
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /v1/push-tokens without auth → 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/push-tokens',
      payload: { token: 'ExponentPushToken[abc]', platform: 'ios' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /v1/push-tokens creates a token with 201', async () => {
    const authorization = await signIn(app);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/push-tokens',
      headers: { authorization },
      payload: { token: 'ExponentPushToken[abc]', platform: 'ios' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; token: string; platform: string }>();
    expect(body.token).toBe('ExponentPushToken[abc]');
    expect(body.platform).toBe('ios');
    expect(body.id).toBeTruthy();
  });

  it('POST /v1/push-tokens rejects empty token with 400', async () => {
    const authorization = await signIn(app);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/push-tokens',
      headers: { authorization },
      payload: { token: '', platform: 'ios' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/push-tokens rejects bad platform with 400', async () => {
    const authorization = await signIn(app);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/push-tokens',
      headers: { authorization },
      payload: { token: 'ExponentPushToken[xyz]', platform: 'windows' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /v1/push-tokens/:id → 204 for owner', async () => {
    const authorization = await signIn(app);
    const create = await app.inject({
      method: 'POST',
      url: '/v1/push-tokens',
      headers: { authorization },
      payload: { token: 'ExponentPushToken[owner]', platform: 'android' },
    });
    const created = create.json<{ id: string }>();
    const del = await app.inject({
      method: 'DELETE',
      url: `/v1/push-tokens/${created.id}`,
      headers: { authorization },
    });
    expect(del.statusCode).toBe(204);
  });

  it('DELETE /v1/push-tokens/:id → 404 for non-owner', async () => {
    const authorization = await signIn(app);
    prisma._tables.pushTokens.rows.push({
      id: 'tok_other',
      userId: 'not-me',
      token: 'ExponentPushToken[other]',
      platform: 'IOS',
      createdAt: new Date(),
      revokedAt: null,
    });
    const del = await app.inject({
      method: 'DELETE',
      url: '/v1/push-tokens/tok_other',
      headers: { authorization },
    });
    expect(del.statusCode).toBe(404);
  });
});
