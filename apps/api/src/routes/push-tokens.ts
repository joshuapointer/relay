import type { PushToken as PrismaPushToken, Platform } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const RegisterBodySchema = z.object({
  token: z.string().min(1, 'token must be non-empty'),
  platform: z.enum(['ios', 'android']),
});

function serialize(row: PrismaPushToken): {
  id: string;
  token: string;
  platform: string;
  createdAt: string;
} {
  return {
    id: row.id,
    token: row.token,
    platform: row.platform.toLowerCase(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function pushTokenRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/push-tokens',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Register a push token', tags: ['push-tokens'] },
    },
    async (request, reply) => {
      const body = RegisterBodySchema.parse(request.body);
      const user = request.user;
      if (!user) return reply.status(401).send();
      const platform: Platform = body.platform === 'ios' ? 'IOS' : 'ANDROID';
      const row = (await app.prisma.pushToken.upsert({
        where: { token: body.token },
        create: {
          userId: user.id,
          token: body.token,
          platform,
        },
        update: {
          userId: user.id,
          platform,
          revokedAt: null,
        },
      })) as PrismaPushToken;
      return reply.status(201).send(serialize(row));
    }
  );

  app.delete(
    '/push-tokens/:id',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Delete a push token', tags: ['push-tokens'] },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const user = request.user;
      if (!user) return reply.status(401).send();
      const existing = (await app.prisma.pushToken.findUnique({
        where: { id },
      })) as PrismaPushToken | null;
      if (!existing || existing.userId !== user.id) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Push token not found',
            traceId: request.id,
          },
        });
      }
      await app.prisma.pushToken.delete({ where: { id } });
      return reply.status(204).send();
    }
  );
}
