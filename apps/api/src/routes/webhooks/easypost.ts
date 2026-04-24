import type { FastifyInstance } from 'fastify';

import { processWebhookEvent } from '../../services/webhook.js';

export async function easypostWebhookRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/webhooks/easypost',
    {
      schema: {
        description: 'EasyPost tracker webhook',
        tags: ['webhooks'],
      },
      config: {
        rawBody: true,
      },
    },
    async (request, reply) => {
      const rawFromReq = (request as unknown as { rawBody?: string }).rawBody;
      const raw =
        rawFromReq ??
        (typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body ?? {}));
      const signature = (request.headers['x-hmac-signature'] ??
        request.headers['x-easypost-signature']) as string | undefined;
      const result = await processWebhookEvent({
        app,
        rawBody: raw,
        ...(signature !== undefined ? { signature } : {}),
      });
      if (result.outcome === 'bad_signature') {
        return reply.status(400).send({
          error: {
            code: 'BAD_SIGNATURE',
            message: 'Invalid HMAC signature',
            traceId: request.id,
          },
        });
      }
      if (result.outcome === 'duplicate') {
        return reply.status(409).send({
          ok: true,
          duplicate: true,
          providerEventId: result.providerEventId,
        });
      }
      return reply.status(202).send({
        ok: true,
        providerEventId: result.providerEventId,
        ...(result.shipmentId ? { shipmentId: result.shipmentId } : {}),
      });
    }
  );
}
