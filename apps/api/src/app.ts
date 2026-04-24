import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Server as IOServer } from 'socket.io';
import { ZodError } from 'zod';

import { prisma as defaultPrisma } from './db/client.js';
import { authPlugin } from './plugins/auth.js';
import { registerApiRoutes, registerRoutes } from './routes/index.js';

export interface BuildAppOptions {
  prisma?: PrismaClient;
  auth?: {
    mockMode?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publicKey?: any;
    jwksUrl?: string;
    issuer?: string;
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    io: IOServer | null;
  }
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const isDev = process.env['NODE_ENV'] !== 'production';
  const isTest = process.env['NODE_ENV'] === 'test' || process.env['VITEST'];

  const app = Fastify({
    logger: isTest
      ? false
      : isDev
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true },
            },
          }
        : true,
  });

  // Preserve raw body for signed webhook verification.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body: string | Buffer, done) => {
      try {
        const asString = typeof body === 'string' ? body : body.toString('utf-8');
        (req as unknown as { rawBody: string }).rawBody = asString;
        const json: unknown = asString.length > 0 ? JSON.parse(asString) : {};
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  // Plugins
  await app.register(helmet, { global: true });
  const corsAllowlist = process.env['CORS_ORIGIN']
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const isProd = process.env['NODE_ENV'] === 'production';
  if (isProd && (!corsAllowlist || corsAllowlist.length === 0)) {
    throw new Error('CORS_ORIGIN must be set to a non-empty allowlist in production');
  }
  await app.register(cors, {
    origin: corsAllowlist && corsAllowlist.length > 0 ? corsAllowlist : true,
    credentials: true,
  });
  await app.register(sensible);
  await app.register(rateLimit, {
    max: Number(process.env['RATE_LIMIT_MAX'] ?? 1000),
    timeWindow: '1 minute',
  });

  // OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Relay API',
        description: 'Shipment tracking aggregation API',
        version: '0.1.0',
      },
      servers: [
        {
          url: process.env['PUBLIC_BASE_URL'] ?? 'http://localhost:4000',
          description: 'Default',
        },
      ],
      tags: [
        { name: 'health', description: 'Health checks' },
        { name: 'shipments', description: 'Shipment CRUD' },
        { name: 'share', description: 'Public share links' },
        { name: 'webhooks', description: 'Carrier webhooks' },
      ],
    },
  });
  await app.register(swaggerUI, {
    routePrefix: '/docs',
  });

  // Prisma decorator (test-injectable)
  const prisma = opts.prisma ?? defaultPrisma;
  app.decorate('prisma', prisma);
  app.decorate('io', null);

  // Auth plugin
  await app.register(authPlugin, opts.auth ?? {});

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors,
          traceId: request.id,
        },
      });
    }

    // Prisma unique constraint violation
    if (
      error.message?.includes('Unique constraint') ||
      (error as { code?: string }).code === 'P2002'
    ) {
      return reply.status(409).send({
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
          traceId: request.id,
        },
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: {
          code: 'RATE_LIMITED',
          message: error.message ?? 'Too many requests',
          traceId: request.id,
        },
      });
    }

    app.log.error({ err: error, reqId: request.id }, 'Unhandled error');
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        traceId: request.id,
      },
    });
  });

  // Routes under /v1
  await app.register(
    async (v1) => {
      await registerApiRoutes(v1);
    },
    { prefix: '/v1' }
  );

  // Health also at root level (no prefix) for load balancer probes
  await app.register(registerRoutes);

  return app;
}
