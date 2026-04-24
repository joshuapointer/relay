/**
 * Typed token access helpers for @relay/ui-core.
 *
 * @relay/design-tokens dist ships tokens as Record<string, unknown>.
 * This module casts to the known shape for safe internal use.
 */
import { tokens as _tokens } from '@relay/design-tokens';

interface TokenColor {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  neutral: string;
  ink: string;
  white: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  inTransit: string;
  delivered: string;
  pending: string;
  exception: string;
  primaryForeground: string;
  outForDelivery: string;
}

interface TokenRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  pill: number;
}

interface TokenShadowValue {
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
  color: string;
}

interface TokenShadow {
  card: TokenShadowValue;
  fab: TokenShadowValue;
}

interface TokenTypography {
  family: { header: string; body: string };
  weight: { regular: number; medium: number; semibold: number; bold: number };
  size: Record<string, number>;
  lineHeight: Record<string, number>;
}

interface TypedTokens {
  color: TokenColor;
  radius: TokenRadius;
  shadow: TokenShadow;
  spacing: Record<string, number>;
  typography: TokenTypography;
  zIndex: Record<string, number>;
}

export const tokens = _tokens as unknown as TypedTokens;

// ---------------------------------------------------------------------------
// Status color — re-implemented here to avoid depending on src/ of design-tokens
// since the package's dist does not yet export statusColor.
// ---------------------------------------------------------------------------

export type DisplayShipmentStatus =
  | 'Pending'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Exception';

/**
 * Returns the brand color hex string for a given shipment display status.
 * BR-1: Delivered → #2ECC71 (success green — ONLY this status)
 * BR-2: In Transit → #FFB800 (accent amber)
 */
export function statusColor(status: DisplayShipmentStatus): string {
  switch (status) {
    case 'Delivered':
      return '#2ECC71';
    case 'In Transit':
      return '#FFB800';
    case 'Out for Delivery':
      return '#FFB800';
    case 'Pending':
      return '#B38600';
    case 'Exception':
      return '#D97706';
  }
}

// RN shadow helper (mirrors design-tokens/native createShadowStyle)
export interface ShadowTokenValue {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export function createShadowStyle(token: ShadowTokenValue): ShadowTokenValue {
  return { ...token };
}
