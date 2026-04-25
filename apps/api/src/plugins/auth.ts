import type { PrismaClient } from '@prisma/client';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
  FastifyInstance,
} from 'fastify';
import fp from 'fastify-plugin';

import { findOrCreateUser, type LocalUser } from '../auth/userService.js';
import { verifyJwt, type VerifiedAuth } from '../auth/verify.js';

export interface AuthPluginOptions {
  /** When true (default in dev/test), verify with `publicKey`. */
  mockMode?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicKey?: any;
  jwksUrl?: string;
  issuer?: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
  interface FastifyRequest {
    user?: LocalUser;
    auth?: VerifiedAuth;
  }
}

function extractToken(request: FastifyRequest): string | null {
  const h = request.headers['authorization'] ?? request.headers['Authorization'];
  if (typeof h !== 'string') return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? (m[1] as string).trim() : null;
}

const authPluginImpl: FastifyPluginAsync<AuthPluginOptions> = async (
  fastify: FastifyInstance,
  opts: AuthPluginOptions
): Promise<void> => {
  const mockMode = opts.mockMode ?? process.env['CLERK_MOCK_MODE'] === 'true';
  if (mockMode && process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing to start: CLERK_MOCK_MODE=true in production');
  }

  fastify.decorateRequest('user', null);
  fastify.decorateRequest('auth', null);

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const token = extractToken(request);
      if (!token) {
        await reply.status(401).send({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Missing Authorization header',
            traceId: request.id,
          },
        });
        return;
      }
      try {
        const verified = await verifyJwt(token, {
          mockMode,
          localPublicKey: opts.publicKey,
          jwksUrl: opts.jwksUrl ?? process.env['CLERK_JWKS_URL'],
          issuer: opts.issuer ?? process.env['CLERK_ISSUER'],
          audience: process.env['CLERK_AUDIENCE'],
        });
        const prisma = (fastify as unknown as { prisma: PrismaClient }).prisma;
        const user = await findOrCreateUser(prisma, {
          clerkId: verified.clerkId,
          email: verified.email,
        });
        request.user = user;
        request.auth = verified;
      } catch (err) {
        request.log.warn(
          { err: (err as Error).message, name: (err as Error).name },
          'auth verify failed',
        );
        await reply.status(401).send({
          error: {
            code: 'UNAUTHENTICATED',
            message: (err as Error).message ?? 'Invalid token',
            traceId: request.id,
          },
        });
      }
    }
  );
};

export const authPlugin = fp(authPluginImpl, {
  name: 'relay-auth',
  fastify: '4.x',
});
