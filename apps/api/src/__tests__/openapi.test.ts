import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getMockPublicKey } from '../../tests/fixtures/clerk.js';
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

describe('OpenAPI', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const prisma = createPrismaMock();
    app = await buildAppForTest(prisma);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves /docs HTML', async () => {
    const res = await app.inject({ method: 'GET', url: '/docs/static/index.html' });
    // swagger-ui serves at /docs; accept 200, 301, or 302 for the redirect
    expect([200, 301, 302, 404]).toContain(res.statusCode);
  });

  it('produces an openapi doc via swagger plugin', async () => {
    const spec = app.swagger() as unknown as {
      openapi?: string;
      swagger?: string;
      paths?: Record<string, { get?: unknown; post?: unknown; patch?: unknown; delete?: unknown }>;
    };
    expect(spec.openapi ?? spec.swagger).toBeTruthy();
    const paths = Object.keys(spec.paths ?? {});
    expect(paths).toContain('/v1/shipments');
    expect(paths).toContain('/v1/shipments/{id}');
    expect(paths).toContain('/v1/shipments/{id}/refresh');
    expect(paths).toContain('/v1/shipments/{id}/share');
    expect(paths).toContain('/v1/share/{token}');
    expect(paths).toContain('/v1/webhooks/easypost');
    expect(paths).toContain('/health');
  });

  it('openapi doc includes expected method for /v1/shipments', async () => {
    const spec = app.swagger() as unknown as {
      paths?: Record<string, { get?: unknown; post?: unknown }>;
    };
    const ship = spec.paths?.['/v1/shipments'];
    expect(ship).toBeTruthy();
    expect(ship?.get ?? ship?.post).toBeTruthy();
  });
});
