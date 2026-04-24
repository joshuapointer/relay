/**
 * constants/strings.ts — Locked product copy (WS-C-05).
 *
 * Tone rules (BR-36..BR-40):
 *  - Clarity over cleverness. No puns, no dad jokes.
 *  - Proactive and reassuring. Acknowledge the emotional weight.
 *  - Professional but helpful. No corporate jargon, no faux-casual.
 *  - Negative events: no celebratory emoji, no stacked exclamation points.
 *  - Forbidden words: just, maybe, simply, sorry, unfortunately.
 *
 * Each string key is grouped by screen / context.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const AUTH = {
  signInTitle: 'Sign in to Relay',
  signInSubtitle: 'Track every shipment in one place.',
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'Password',
  passwordPlaceholder: '••••••••••',
  signInCta: 'Sign In',
  signUpCta: 'Create account',
  signUpTitle: 'Create your account',
  signUpSubtitle: 'Get started with Relay.',
  noAccount: "Don't have an account?",
  haveAccount: 'Already have an account?',
  signingIn: 'Signing in…',
  signingUp: 'Creating account…',
} as const;

// ---------------------------------------------------------------------------
// Home screen
// ---------------------------------------------------------------------------
export const HOME = {
  greeting: (name: string) => `Welcome back, ${name}`,
  greetingFallback: 'Welcome back',
  emptyTitle: 'No shipments yet.',
  emptyBody: 'Tap + to add your first package.',
  filterAll: 'All',
  filterPending: 'Pending',
  filterInTransit: 'In Transit',
  filterOutForDelivery: 'Out for Delivery',
  filterDelivered: 'Delivered',
  filterException: 'Exception',
  refreshing: 'Refreshing…',
  addShipmentA11y: 'Add shipment',
} as const;

// ---------------------------------------------------------------------------
// Add shipment screen
// ---------------------------------------------------------------------------
export const ADD = {
  title: 'Add Shipment',
  cancel: 'Cancel',
  trackingNumberLabel: 'Tracking Number',
  trackingNumberPlaceholder: 'e.g. 9400111899223409376213',
  carrierLabel: 'Carrier',
  carrierPlaceholder: 'Select carrier',
  nicknameLabel: 'Nickname (optional)',
  nicknamePlaceholder: 'e.g. Mom\'s birthday gift',
  carrierHint: 'Carrier is detected automatically when left blank.',
  submitCta: 'Track Shipment',
  submitting: 'Adding…',
  validationTrackingRequired: 'Enter a tracking number to continue.',
  errorGeneric: 'Unable to add that shipment. Check the tracking number and try again.',
} as const;

// ---------------------------------------------------------------------------
// Shipment detail screen
// ---------------------------------------------------------------------------
export const DETAIL = {
  sectionStatus: 'Status',
  sectionTracking: 'Tracking Number',
  sectionCarrier: 'Carrier',
  sectionEta: 'Estimated Delivery',
  sectionTimeline: 'Tracking History',
  sectionMap: 'Map',
  mapPlaceholder: 'Map visualization coming soon.',
  etaFormat: (date: string) => `Arriving ${date}`,
  noEta: 'Estimated delivery date not available.',
  noTimeline: 'No tracking events yet.',
  shareButton: 'Share',
  deleteButton: 'Delete Shipment',
  deleteConfirmTitle: 'Delete Shipment',
  deleteConfirmBody:
    'This shipment will be removed from your account. Carrier records are unaffected.',
  deleteConfirmAction: 'Delete',
  deleteCancel: 'Cancel',
  errorLoad: 'Unable to load shipment details. Pull down to try again.',
  refetchLabel: 'Retry',
} as const;

// ---------------------------------------------------------------------------
// Profile screen
// ---------------------------------------------------------------------------
export const PROFILE = {
  title: 'Profile',
  emailLabel: 'Email',
  memberSinceLabel: 'Member since',
  notificationsLabel: 'Manage push notifications',
  signOut: 'Sign Out',
  signingOut: 'Signing out…',
  deleteAccount: 'Delete Account',
  deleteConfirmTitle: 'Delete Account',
  deleteConfirmBody:
    'Your account and all shipment data will be permanently deleted within 30 days. This action cannot be reversed.',
  deleteConfirmAction: 'Delete My Account',
  deleteCancel: 'Cancel',
} as const;

// ---------------------------------------------------------------------------
// Status labels (mirrors DisplayShipmentStatus)
// ---------------------------------------------------------------------------
export const STATUS_LABELS = {
  Pending: 'Pending',
  'In Transit': 'In Transit',
  'Out for Delivery': 'Out for Delivery',
  Delivered: 'Delivered',
  Exception: 'Exception',
} as const;

// ---------------------------------------------------------------------------
// Generic error + loading states
// ---------------------------------------------------------------------------
export const COMMON = {
  loading: 'Loading…',
  errorGeneric: 'Something went wrong. Pull down to try again.',
  retry: 'Retry',
  networkError: 'Unable to reach Relay. Check your connection and try again.',
  liveUpdatesPaused: 'Live updates temporarily paused.',
} as const;
