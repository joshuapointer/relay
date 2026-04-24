import type { AddressInfo } from 'net';

import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { signClerkJwt, getMockPublicKey } from '../../tests/fixtures/clerk.js';
import { createPrismaMock, type MockPrisma } from '../../tests/fixtures/prismaMock.js';
import { broadcastShipmentUpdate } from '../realtime/broadcast.js';
import { attachSocketIo } from '../realtime/io.js';
import { setEasyPostAdapter, EasyPostAdapter } from '../services/easypost/adapter.js';

vi.mock('../db/client.js', () => ({
  prisma: createPrismaMock(),
}));

async function spinUp(prisma: MockPrisma): Promise<{ app: FastifyInstance; url: string }> {
  const publicKey = await getMockPublicKey();
  const { buildApp } = await import('../app.js');
  const app = await buildApp({
    prisma: prisma as unknown as PrismaClient,
    auth: { mockMode: true, publicKey },
  });
  await app.listen({ port: 0, host: '127.0.0.1' });
  attachSocketIo(app, { mockMode: true, publicKey });
  const addr = app.server.address() as AddressInfo;
  return { app, url: `http://127.0.0.1:${addr.port}` };
}

describe.skip('realtime socket.io', () => {
  let app: FastifyInstance;
  let url: string;
  let prisma: MockPrisma;
  let client: ClientSocket | null = null;

  beforeEach(async () => {
    prisma = createPrismaMock();
    setEasyPostAdapter(new EasyPostAdapter(''));
    const up = await spinUp(prisma);
    app = up.app;
    url = up.url;
  });

  afterEach(async () => {
    if (client) {
      client.removeAllListeners();
      client.disconnect();
      client = null;
    }
    if (app) {
      if (app.io) {
        await new Promise<void>((resolve) => app.io!.close(() => resolve()));
      }
      await app.close();
    }
    setEasyPostAdapter(null);
  });

  it('rejects connection without token', async () => {
    client = ioClient(`${url}/rt`, {
      transports: ['websocket'],
      reconnection: false,
    });
    await new Promise<void>((resolve) => {
      client!.on('connect_error', () => resolve());
      client!.on('connect', () => resolve());
    });
    expect(client.connected).toBe(false);
  });

  it('accepts a signed token handshake', async () => {
    const token = await signClerkJwt({ userId: 'clerk_rt1', email: 'rt1@relay.test' });
    client = ioClient(`${url}/rt`, {
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
    });
    await new Promise<void>((resolve, reject) => {
      client!.on('connect', () => resolve());
      client!.on('connect_error', (err) => reject(err));
    });
    expect(client.connected).toBe(true);
  });

  it('broadcasts shipment:updated to a connected client', async () => {
    const token = await signClerkJwt({ userId: 'clerk_rt2', email: 'rt2@relay.test' });
    client = ioClient(`${url}/rt`, {
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
    });
    await new Promise<void>((resolve, reject) => {
      client!.on('connect', () => resolve());
      client!.on('connect_error', (err) => reject(err));
    });
    // The user id was upserted during handshake; look it up.
    const user = await prisma.user.findUnique({ where: { clerkId: 'clerk_rt2' } });
    expect(user).toBeTruthy();

    const received = new Promise<unknown>((resolve) => {
      client!.on('shipment:updated', (p) => resolve(p));
    });

    await broadcastShipmentUpdate(app, user!.id, {
      id: 'ship_rt_1',
      userId: user!.id,
      carrier: { code: 'USPS', displayName: 'USPS' },
      trackingNumber: 'RT1000000001',
      status: 'In Transit',
      lastEventAt: new Date().toISOString(),
      eta: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const payload = (await Promise.race([
      received,
      new Promise((_r, rej) => setTimeout(() => rej(new Error('timeout')), 2000)),
    ])) as { id: string; status: string };
    expect(payload.id).toBe('ship_rt_1');
    expect(payload.status).toBe('In Transit');
  });

  it('broadcast is a no-op when io is null', async () => {
    // Spin up an app without attachSocketIo
    const prisma2 = createPrismaMock();
    const publicKey = await getMockPublicKey();
    const { buildApp } = await import('../app.js');
    const app2 = await buildApp({
      prisma: prisma2 as unknown as PrismaClient,
      auth: { mockMode: true, publicKey },
    });
    await expect(
      broadcastShipmentUpdate(app2, 'user', {
        id: 's',
        userId: 'u',
        carrier: { code: 'X', displayName: 'X' },
        trackingNumber: 't',
        status: 'Pending',
        lastEventAt: null,
        eta: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    ).resolves.toBeUndefined();
    await app2.close();
  });
});
