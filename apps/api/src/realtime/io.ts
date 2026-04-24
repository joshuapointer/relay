import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { Server as IOServer, type Socket } from 'socket.io';

import { findOrCreateUser } from '../auth/userService.js';
import { verifyJwt } from '../auth/verify.js';

export interface IoInitOptions {
  mockMode: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicKey?: any;
  jwksUrl?: string | undefined;
  issuer?: string | undefined;
}

declare module 'fastify' {
  interface FastifyInstance {
    io: IOServer | null;
  }
}

export function attachSocketIo(app: FastifyInstance, opts: IoInitOptions): IOServer {
  const allowlist = process.env['CORS_ORIGIN']?.split(',').map((s) => s.trim()).filter(Boolean);
  const isProd = process.env['NODE_ENV'] === 'production';
  const corsOrigin: string[] | boolean =
    allowlist && allowlist.length > 0 ? allowlist : isProd ? false : true;
  const io = new IOServer(app.server, {
    cors: { origin: corsOrigin, credentials: true },
    path: '/socket.io',
    connectTimeout: 5000,
  });

  const nsp = io.of('/rt');
  nsp.use(async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token =
        (socket.handshake.auth?.['token'] as string | undefined) ??
        (socket.handshake.headers['authorization'] as string | undefined)?.replace(
          /^Bearer\s+/i,
          ''
        );
      if (!token) throw new Error('missing token');
      const verified = await verifyJwt(token, {
        mockMode: opts.mockMode,
        localPublicKey: opts.publicKey,
        jwksUrl: opts.jwksUrl,
        issuer: opts.issuer,
      });
      const prisma = (app as unknown as { prisma: PrismaClient }).prisma;
      const user = await findOrCreateUser(prisma, {
        clerkId: verified.clerkId,
        email: verified.email,
      });
      (socket.data as Record<string, unknown>)['userId'] = user.id;
      await socket.join(`user:${user.id}`);
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  nsp.on('connection', (socket: Socket) => {
    socket.on('shipment:subscribe', ({ shipmentId }: { shipmentId: string }) => {
      const userId = (socket.data as Record<string, unknown>)['userId'] as string | undefined;
      if (!userId) return;
      const prisma = (app as unknown as { prisma: PrismaClient }).prisma;
      prisma.shipment
        .findFirst({ where: { id: shipmentId, userId }, select: { id: true } })
        .then((owned) => {
          if (owned) void socket.join(`shipment:${shipmentId}`);
        })
        .catch(() => void 0);
    });
    socket.on('shipment:unsubscribe', ({ shipmentId }: { shipmentId: string }) => {
      void socket.leave(`shipment:${shipmentId}`);
    });
  });

  // buildApp already added the `io` decorator slot as null; mutate it here
  // since we're post-listen and can't decorate again.
  (app as unknown as { io: IOServer | null }).io = io;

  // Wire a close handler that Fastify will run on shutdown. Since we may be
  // post-listen here (typical: attach after app.listen()), register the
  // close handler via server close event instead of addHook.
  app.server.on('close', () => {
    io.close();
  });

  return io;
}
