import {
  CreateShipmentInputSchema,
  UpdateShipmentInputSchema,
  DisplayShipmentStatusSchema,
} from '@relay/shared-types';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { getCopyForTransition } from '../content/notifications.js';
import { broadcastShipmentUpdate } from '../realtime/broadcast.js';
import type { DisplayShipmentStatus } from '../schemas/status.js';
import { getEasyPostAdapter } from '../services/easypost/adapter.js';
import { enqueuePushNotification } from '../services/push.js';
import { ShipmentsService, ShipmentError } from '../services/shipments.js';

export async function shipmentRoutes(app: FastifyInstance): Promise<void> {
  const getService = (): ShipmentsService =>
    new ShipmentsService(app.prisma, getEasyPostAdapter());

  app.post(
    '/shipments',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Create a shipment',
        tags: ['shipments'],
      },
    },
    async (request, reply) => {
      const body = CreateShipmentInputSchema.parse(request.body);
      const user = request.user;
      if (!user) return reply.status(401).send();
      try {
        const svc = getService();
        const shipment = await svc.createShipment(body, user.id);
        await broadcastShipmentUpdate(app, user.id, shipment);
        return reply.status(201).send(shipment);
      } catch (err) {
        if (err instanceof ShipmentError) {
          return reply.status(err.status).send({
            error: { code: err.code, message: err.message, traceId: request.id },
          });
        }
        throw err;
      }
    }
  );

  const ListQuery = z.object({
    status: DisplayShipmentStatusSchema.optional(),
  });

  app.get(
    '/shipments',
    {
      preHandler: [app.authenticate],
      schema: { description: 'List shipments', tags: ['shipments'] },
    },
    async (request, reply) => {
      const query = ListQuery.parse(request.query);
      const user = request.user;
      if (!user) return reply.status(401).send();
      const svc = getService();
      const result = await svc.listShipments(user.id, query);
      return reply.send(result);
    }
  );

  app.get(
    '/shipments/:id',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Get a shipment', tags: ['shipments'] },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const user = request.user;
      if (!user) return reply.status(401).send();
      try {
        const svc = getService();
        const shipment = await svc.getShipment(id, user.id);
        return reply.send(shipment);
      } catch (err) {
        if (err instanceof ShipmentError) {
          return reply.status(err.status).send({
            error: { code: err.code, message: err.message, traceId: request.id },
          });
        }
        throw err;
      }
    }
  );

  app.patch(
    '/shipments/:id',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Update a shipment', tags: ['shipments'] },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = UpdateShipmentInputSchema.parse(request.body);
      const user = request.user;
      if (!user) return reply.status(401).send();
      try {
        const svc = getService();
        const shipment = await svc.updateShipment(id, user.id, body);
        return reply.send(shipment);
      } catch (err) {
        if (err instanceof ShipmentError) {
          return reply.status(err.status).send({
            error: { code: err.code, message: err.message, traceId: request.id },
          });
        }
        throw err;
      }
    }
  );

  app.delete(
    '/shipments/:id',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Delete a shipment', tags: ['shipments'] },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const user = request.user;
      if (!user) return reply.status(401).send();
      try {
        const svc = getService();
        await svc.deleteShipment(id, user.id);
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof ShipmentError) {
          return reply.status(err.status).send({
            error: { code: err.code, message: err.message, traceId: request.id },
          });
        }
        throw err;
      }
    }
  );

  app.post(
    '/shipments/:id/refresh',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Refresh shipment tracking', tags: ['shipments'] },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const user = request.user;
      if (!user) return reply.status(401).send();
      try {
        const svc = getService();
        const before = await svc.getShipment(id, user.id);
        const after = await svc.refreshShipment(id, user.id);
        await broadcastShipmentUpdate(app, user.id, after);
        if (before.status !== after.status) {
          const copy = getCopyForTransition(
            before.status as DisplayShipmentStatus,
            after.status as DisplayShipmentStatus,
            { eta: after.eta }
          );
          await enqueuePushNotification(app.prisma, {
            userId: user.id,
            shipmentId: after.id,
            type: copy.kind === 'DELIVERED' ? 'DELIVERED' : copy.kind === 'DELAY' ? 'DELAY' : copy.kind === 'EXCEPTION' ? 'EXCEPTION' : 'STATUS_CHANGE',
            title: copy.title,
            body: copy.body,
          });
        }
        return reply.send(after);
      } catch (err) {
        if (err instanceof ShipmentError) {
          return reply.status(err.status).send({
            error: { code: err.code, message: err.message, traceId: request.id },
          });
        }
        throw err;
      }
    }
  );
}
