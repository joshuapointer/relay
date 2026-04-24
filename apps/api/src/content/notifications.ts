import type { DisplayShipmentStatus } from '../schemas/status.js';

export type NotificationKind = 'STATUS' | 'DELAY' | 'DELIVERED' | 'EXCEPTION';

export interface NotificationCopy {
  title: string;
  body: string;
  kind: NotificationKind;
}

export type TransitionKey = `${DisplayShipmentStatus}->${DisplayShipmentStatus}`;

/**
 * 15 locked transition entries covering the useful edges of the 5x5 status matrix.
 *
 * Tone rules (mirrored in `content-lint`):
 *   - Clarity-first, proactive, professional
 *   - Forbidden words: "just", "maybe", "simply", "sorry", "unfortunately"
 *   - No exclamation marks
 *   - Title <= 60 chars, body <= 120 chars
 */
export const NOTIFICATIONS = {
  'Pending->In Transit': {
    title: 'Your shipment is on the move',
    body: 'Your package left the carrier origin and is now in transit.',
    kind: 'STATUS',
  },
  'Pending->Out for Delivery': {
    title: 'Out for delivery today',
    body: 'The carrier has your package on a delivery vehicle heading your way.',
    kind: 'STATUS',
  },
  'Pending->Delivered': {
    title: 'Your package arrived',
    body: 'The carrier marked your shipment as delivered.',
    kind: 'DELIVERED',
  },
  'Pending->Exception': {
    title: 'Shipment needs attention',
    body: 'The carrier flagged an issue with your package. Track details for more info.',
    kind: 'EXCEPTION',
  },
  'In Transit->Out for Delivery': {
    title: 'Out for delivery today',
    body: 'Your package is on a delivery vehicle and should arrive soon.',
    kind: 'STATUS',
  },
  'In Transit->Delivered': {
    title: 'Your package arrived',
    body: 'The carrier confirmed delivery of your shipment.',
    kind: 'DELIVERED',
  },
  'In Transit->Exception': {
    title: 'Delivery delay detected',
    body: "There's an issue with your shipment. We'll keep you posted as it resolves.",
    kind: 'EXCEPTION',
  },
  'In Transit->In Transit': {
    title: 'Shipment update',
    body: 'Your package is continuing on its journey.',
    kind: 'STATUS',
  },
  'Out for Delivery->Delivered': {
    title: 'Package delivered',
    body: 'Your shipment arrived. Check the carrier photo if available.',
    kind: 'DELIVERED',
  },
  'Out for Delivery->Exception': {
    title: 'Delivery attempt issue',
    body: 'The carrier could not complete delivery today. A new attempt is scheduled.',
    kind: 'EXCEPTION',
  },
  'Out for Delivery->In Transit': {
    title: 'Delivery rescheduled',
    body: 'Your package went back to the local facility. A new delivery date is pending.',
    kind: 'STATUS',
  },
  'Exception->In Transit': {
    title: 'Back on track',
    body: 'Good news — your shipment resumed moving after the earlier issue.',
    kind: 'STATUS',
  },
  'Exception->Out for Delivery': {
    title: 'Out for delivery today',
    body: 'The exception cleared and your package is now on a delivery vehicle.',
    kind: 'STATUS',
  },
  'Exception->Delivered': {
    title: 'Delivered after delay',
    body: 'Your package made it through. The carrier has confirmed delivery.',
    kind: 'DELIVERED',
  },
  'Exception->Exception': {
    title: 'Delay continues',
    body: "There's a slight delay; we'll share the new estimate as soon as the carrier posts one.",
    kind: 'EXCEPTION',
  },
} as const satisfies Record<TransitionKey | string, NotificationCopy>;

export type TransitionTuple = readonly [DisplayShipmentStatus, DisplayShipmentStatus, NotificationKind];

export const ALL_TRANSITIONS: readonly TransitionTuple[] = [
  ['Pending', 'In Transit', 'STATUS'],
  ['Pending', 'Out for Delivery', 'STATUS'],
  ['Pending', 'Delivered', 'DELIVERED'],
  ['Pending', 'Exception', 'EXCEPTION'],
  ['In Transit', 'Out for Delivery', 'STATUS'],
  ['In Transit', 'Delivered', 'DELIVERED'],
  ['In Transit', 'Exception', 'EXCEPTION'],
  ['In Transit', 'In Transit', 'STATUS'],
  ['Out for Delivery', 'Delivered', 'DELIVERED'],
  ['Out for Delivery', 'Exception', 'EXCEPTION'],
  ['Out for Delivery', 'In Transit', 'STATUS'],
  ['Exception', 'In Transit', 'STATUS'],
  ['Exception', 'Out for Delivery', 'STATUS'],
  ['Exception', 'Delivered', 'DELIVERED'],
  ['Exception', 'Exception', 'EXCEPTION'],
] as const;

export const FORBIDDEN_WORDS = ['just', 'maybe', 'simply', 'sorry', 'unfortunately'] as const; // content-lint-disable-line

const FALLBACK: NotificationCopy = {
  title: 'Shipment update',
  body: 'Your shipment status changed. Open the app for the latest details.',
  kind: 'STATUS',
};

/**
 * Returns catalog copy for a transition. Caller may pass `{ eta }` to inject
 * context into an Exception body for delays.
 */
export function getCopyForTransition(
  from: DisplayShipmentStatus,
  to: DisplayShipmentStatus,
  ctx: { eta?: string | Date | null } = {}
): NotificationCopy {
  const key = `${from}->${to}` as TransitionKey;
  const base =
    (NOTIFICATIONS as Record<string, NotificationCopy>)[key] ?? FALLBACK;

  // Inject ETA for exception-family transitions when present
  if (base.kind === 'EXCEPTION' && ctx.eta) {
    const etaDate = ctx.eta instanceof Date ? ctx.eta : new Date(ctx.eta);
    if (!Number.isNaN(etaDate.getTime())) {
      const pretty = etaDate.toISOString().slice(0, 10);
      const withEta = `${base.body.replace(/\.\s*$/, '')}. New estimate: ${pretty}.`;
      if (withEta.length <= 120) {
        return { ...base, body: withEta };
      }
    }
  }

  return base;
}
