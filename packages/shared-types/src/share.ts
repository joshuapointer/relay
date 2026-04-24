import { z } from 'zod';
import { DisplayShipmentStatusSchema } from './status.js';
import { TrackingEventSchema } from './shipment.js';

export const ShareLinkSchema = z.object({
  token: z.string(),
  shipmentId: z.string(),
  expiresAt: z.string().datetime(),
});

export type ShareLink = z.infer<typeof ShareLinkSchema>;

export const PublicShipmentViewSchema = z.object({
  carrier: z.object({
    code: z.string(),
    displayName: z.string(),
  }),
  trackingNumber: z.string(),
  status: DisplayShipmentStatusSchema,
  eta: z.string().datetime().nullable(),
  recentEvents: z.array(TrackingEventSchema).max(5),
});

export type PublicShipmentView = z.infer<typeof PublicShipmentViewSchema>;

export const CreateShareLinkInputSchema = z.object({
  ttlDays: z.number().int().min(1).max(30).optional().default(7),
});

export type CreateShareLinkInput = z.infer<typeof CreateShareLinkInputSchema>;
