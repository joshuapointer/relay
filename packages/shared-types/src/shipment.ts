import { z } from 'zod';
import { DisplayShipmentStatusSchema } from './status.js';

export const CarrierSchema = z.object({
  code: z.string(),
  displayName: z.string(),
});

export type Carrier = z.infer<typeof CarrierSchema>;

export const ShipmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  carrier: CarrierSchema,
  trackingNumber: z.string(),
  nickname: z.string().optional(),
  status: DisplayShipmentStatusSchema,
  lastEventAt: z.string().datetime().nullable(),
  eta: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Shipment = z.infer<typeof ShipmentSchema>;

export const TrackingEventSchema = z.object({
  id: z.string(),
  shipmentId: z.string(),
  occurredAt: z.string().datetime(),
  status: DisplayShipmentStatusSchema,
  description: z.string(),
  location: z.string().nullable(),
});

export type TrackingEvent = z.infer<typeof TrackingEventSchema>;

export const ShipmentDetailSchema = ShipmentSchema.extend({
  events: z.array(TrackingEventSchema),
});

export type ShipmentDetail = z.infer<typeof ShipmentDetailSchema>;

export const CreateShipmentInputSchema = z.object({
  trackingNumber: z.string().min(1),
  carrierCode: z.string().optional(),
  nickname: z.string().optional(),
});

export type CreateShipmentInput = z.infer<typeof CreateShipmentInputSchema>;

export const UpdateShipmentInputSchema = z.object({
  nickname: z.string().optional(),
});

export type UpdateShipmentInput = z.infer<typeof UpdateShipmentInputSchema>;

export const ShipmentListResponseSchema = z.object({
  items: z.array(ShipmentSchema),
  cursor: z.string().optional(),
});

export type ShipmentListResponse = z.infer<typeof ShipmentListResponseSchema>;
