import type { FastifyInstance } from 'fastify';

import { healthRoutes } from './health.js';
import { meRoutes } from './me.js';
import { notificationRoutes } from './notifications.js';
import { pushTokenRoutes } from './push-tokens.js';
import { shareRoutes } from './share.js';
import { shipmentRoutes } from './shipments.js';
import { easypostWebhookRoutes } from './webhooks/easypost.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
}

export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
  await app.register(meRoutes);
  await app.register(shipmentRoutes);
  await app.register(shareRoutes);
  await app.register(notificationRoutes);
  await app.register(pushTokenRoutes);
  await app.register(easypostWebhookRoutes);
}
