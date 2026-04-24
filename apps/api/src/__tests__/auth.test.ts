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
  const app = await buildApp({
    prisma: prisma as unknown as PrismaClient,
    auth: { mockMode: true, publicKey },
  });
  app.get('/v1/auth-test', { preHandler: [app.authenticate] }, async (req) => ({
    userId: req.user?.id,
    clerkId: req.user?.clerkId,
    email: req.user?.email,
  }));
  return app;
}

describe('auth plugin', () => {
  let app: FastifyInstance;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createPrismaMock();
    app = await buildAppForTest(prisma);
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects missing token with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/auth-test' });
    expect(res.statusCode).toBe(401);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects invalid token with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/auth-test',
      headers: { authorization: 'Bearer garbage.jwt.value' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('accepts a signed JWT and attaches user', async () => {
    const token = await signClerkJwt({
      userId: 'clerk_abc123',
      email: 'alice@relay.test',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/auth-test',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ clerkId: string; email: string; userId: string }>();
    expect(body.clerkId).toBe('clerk_abc123');
    expect(body.email).toBe('alice@relay.test');
    expect(typeof body.userId).toBe('string');
  });

  it('auto-creates a local user row on first authenticated request', async () => {
    const token = await signClerkJwt({
      userId: 'clerk_new',
      email: 'new@relay.test',
    });
    await app.inject({
      method: 'GET',
      url: '/v1/auth-test',
      headers: { authorization: `Bearer ${token}` },
    });
    const count = await prisma.user.count();
    expect(count).toBe(1);
  });

  it('expired token returns 401', async () => {
    const token = await signClerkJwt(
      { userId: 'clerk_exp', email: 'exp@relay.test' },
      { expiresIn: '-10s' }
    );
    const res = await app.inject({
      method: 'GET',
      url: '/v1/auth-test',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });
});
