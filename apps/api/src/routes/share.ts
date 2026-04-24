import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  createShareLink,
  getPublicShipmentView,
  ShareError,
} from '../services/share.js';

const CreateShareBody = z.object({
  ttlDays: z.number().int().min(1).max(30).optional(),
});

export async function shareRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/shipments/:id/share',
    {
      preHandler: [app.authenticate],
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 hour',
          keyGenerator: (req): string => req.user?.id ?? req.ip,
        },
      },
      schema: { description: 'Create share link', tags: ['share'] },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = CreateShareBody.parse(request.body ?? {});
      const user = request.user;
      if (!user) return reply.status(401).send();
      try {
        const result = await createShareLink(app.prisma, {
          shipmentId: id,
          userId: user.id,
          ...(body.ttlDays !== undefined ? { ttlDays: body.ttlDays } : {}),
        });
        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof ShareError) {
          return reply.status(err.status).send({
            error: { code: err.code, message: err.message, traceId: request.id },
          });
        }
        throw err;
      }
    }
  );

  app.get(
    '/share/:token',
    {
      schema: { description: 'Public share view', tags: ['share'] },
    },
    async (request, reply) => {
      const { token } = z.object({ token: z.string() }).parse(request.params);
      try {
        const view = await getPublicShipmentView(app.prisma, token);
        return reply.send(view);
      } catch (err) {
        if (err instanceof ShareError) {
          return reply.status(err.status).send({
            error: { code: err.code, message: err.message, traceId: request.id },
          });
        }
        throw err;
      }
    }
  );
}
