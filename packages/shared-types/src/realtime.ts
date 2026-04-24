import { z } from 'zod';
import { ShipmentSchema } from './shipment.js';
import { NotificationSchema } from './notification.js';

export const TrackingEventRealtimeSchema = z.object({
  id: z.string(),
  shipmentId: z.string(),
  occurredAt: z.string().datetime(),
  description: z.string(),
  location: z.string().nullable(),
});

export type TrackingEventRealtime = z.infer<typeof TrackingEventRealtimeSchema>;

export const ShipmentUpdatedPayloadSchema = ShipmentSchema;
export type ShipmentUpdatedPayload = z.infer<typeof ShipmentUpdatedPayloadSchema>;

export const ShipmentDeliveredPayloadSchema = ShipmentSchema;
export type ShipmentDeliveredPayload = z.infer<typeof ShipmentDeliveredPayloadSchema>;

export const ShipmentExceptionPayloadSchema = ShipmentSchema;
export type ShipmentExceptionPayload = z.infer<typeof ShipmentExceptionPayloadSchema>;

export const RealtimeErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type RealtimeErrorPayload = z.infer<typeof RealtimeErrorPayloadSchema>;

/** Socket.IO server → client event catalog */
export const ServerToClientEventsSchema = z.object({
  'shipment:updated': ShipmentUpdatedPayloadSchema,
  'shipment:delivered': ShipmentDeliveredPayloadSchema,
  'shipment:exception': ShipmentExceptionPayloadSchema,
  'notification:created': NotificationSchema,
  'tracking:event': TrackingEventRealtimeSchema,
  error: RealtimeErrorPayloadSchema,
  ping: z.object({}),
});

export type ServerToClientEvents = {
  'shipment:updated': (payload: ShipmentUpdatedPayload) => void;
  'shipment:delivered': (payload: ShipmentDeliveredPayload) => void;
  'shipment:exception': (payload: ShipmentExceptionPayload) => void;
  'notification:created': (payload: z.infer<typeof NotificationSchema>) => void;
  'tracking:event': (payload: TrackingEventRealtime) => void;
  error: (payload: RealtimeErrorPayload) => void;
  ping: () => void;
};

export const SubscribePayloadSchema = z.object({ shipmentId: z.string() });
export const UnsubscribePayloadSchema = z.object({ shipmentId: z.string() });

export type SubscribePayload = z.infer<typeof SubscribePayloadSchema>;
export type UnsubscribePayload = z.infer<typeof UnsubscribePayloadSchema>;

/** Socket.IO client → server event catalog */
export type ClientToServerEvents = {
  'shipment:subscribe': (payload: SubscribePayload) => void;
  'shipment:unsubscribe': (payload: UnsubscribePayload) => void;
};
