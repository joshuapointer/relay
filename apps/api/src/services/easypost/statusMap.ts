import type { InternalShipmentStatus } from '../../schemas/status.js';

/**
 * Maps the EasyPost `tracker.status` string to Relay's 7-member internal enum.
 * Unknown codes collapse to UNKNOWN and a warn log is emitted by the caller.
 *
 * Reference: https://www.easypost.com/docs/api#tracker-object
 */
const EASYPOST_STATUS_MAP: Record<string, InternalShipmentStatus> = {
  pre_transit: 'PENDING',
  unknown: 'UNKNOWN',
  in_transit: 'IN_TRANSIT',
  out_for_delivery: 'OUT_FOR_DELIVERY',
  delivered: 'DELIVERED',
  available_for_pickup: 'OUT_FOR_DELIVERY',
  return_to_sender: 'RETURNED',
  failure: 'EXCEPTION',
  cancelled: 'EXCEPTION',
  error: 'EXCEPTION',
};

export function mapEasyPostStatus(raw: string | null | undefined): InternalShipmentStatus {
  if (!raw) return 'UNKNOWN';
  return EASYPOST_STATUS_MAP[raw.toLowerCase()] ?? 'UNKNOWN';
}
