import { z } from 'zod';

export const InternalShipmentStatusSchema = z.enum([
  'PENDING',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
  'RETURNED',
  'UNKNOWN',
]);

export type InternalShipmentStatus = z.infer<typeof InternalShipmentStatusSchema>;

export const DisplayShipmentStatusSchema = z.enum([
  'Pending',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Exception',
]);

export type DisplayShipmentStatus = z.infer<typeof DisplayShipmentStatusSchema>;

const INTERNAL_TO_DISPLAY: Record<InternalShipmentStatus, DisplayShipmentStatus> = {
  PENDING: 'Pending',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  EXCEPTION: 'Exception',
  RETURNED: 'Exception',
  UNKNOWN: 'Exception',
};

export function toDisplay(internal: InternalShipmentStatus): DisplayShipmentStatus {
  return INTERNAL_TO_DISPLAY[internal];
}
