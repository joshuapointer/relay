import type { Notification as PrismaNotification } from '@prisma/client';
import { NotificationSchema } from '@relay/shared-types';
import type { Notification } from '@relay/shared-types';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const LIST_LIMIT = 50;

function serialize(row: PrismaNotification): Notification {
  return NotificationSchema.parse({
    id: row.id,
    userId: row.userId,
    shipmentId: row.shipmentId ?? null,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.readAt?.toISOString() ?? null,
    sentAt: row.deliveredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  });
}

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/notifications',
    {
      preHandler: [app.authenticate],
      schema: { description: 'List notifications for the current user', tags: ['notifications'] },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) return reply.status(401).send();
      const rows = (await app.prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
      })) as PrismaNotification[];
      return reply.send({ items: rows.map(serialize) });
    }
  );

  app.post(
    '/notifications/:id/read',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Mark a notification as read', tags: ['notifications'] },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const user = request.user;
      if (!user) return reply.status(401).send();
      const existing = (await app.prisma.notification.findUnique({
        where: { id },
      })) as PrismaNotification | null;
      if (!existing || existing.userId !== user.id) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Notification not found',
            traceId: request.id,
          },
        });
      }
      const updated = (await app.prisma.notification.update({
        where: { id },
        data: { readAt: existing.readAt ?? new Date() },
      })) as PrismaNotification;
      return reply.send(serialize(updated));
    }
  );

  app.post(
    '/notifications/read-all',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Mark all notifications as read', tags: ['notifications'] },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) return reply.status(401).send();
      const result = await app.prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return reply.send({ count: result.count });
    }
  );
}
