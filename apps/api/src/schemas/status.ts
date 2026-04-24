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

export function toDisplay(internal: InternalShipmentStatus): DisplayShipmentStatus {
  switch (internal) {
    case 'PENDING':
      return 'Pending';
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery';
    case 'DELIVERED':
      return 'Delivered';
    case 'EXCEPTION':
      return 'Exception';
    case 'RETURNED':
      return 'Exception';
    case 'UNKNOWN':
      return 'Exception';
  }
}
