/**
 * @relay/design-tokens — primary entry point
 *
 * Re-exports generated tokens from dist/ (available after `pnpm build`)
 * and exposes a statusColor() helper for mapping shipment status → token color.
 */

// Re-export generated tokens (built by style-dictionary.config.mjs)
export { tokens, type Tokens } from '../dist/index.js';

// ---------------------------------------------------------------------------
// Status → color mapping
// ---------------------------------------------------------------------------

/**
 * The five display statuses used throughout the Relay UI.
 * Matches the backend ShipmentStatus enum (normalized for display).
 */
export type DisplayShipmentStatus =
  | 'Pending'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Exception';

/**
 * Returns the brand color hex string for a given shipment display status.
 *
 * - Delivered → #2ECC71 (success green — ONLY this status uses this color)
 * - In Transit → #FFB800 (accent amber)
 * - Out for Delivery → #FFB800 (accent amber)
 * - Pending → #B38600 (amber dim)
 * - Exception → #D97706 (amber + border tone)
 */
export function statusColor(status: DisplayShipmentStatus): string {
  switch (status) {
    case 'Delivered':
      return '#2ECC71'; // success green — BR-1: ONLY for Delivered
    case 'In Transit':
      return '#FFB800'; // accent amber — BR-2
    case 'Out for Delivery':
      return '#FFB800'; // accent amber
    case 'Pending':
      return '#B38600'; // amber dim
    case 'Exception':
      return '#D97706'; // amber + border tone
  }
}
