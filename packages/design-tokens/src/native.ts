/**
 * @relay/design-tokens/native — React Native entry point
 *
 * Re-exports generated native tokens from dist/ (available after `pnpm build`)
 * and exposes createShadowStyle() for RN-compatible shadow objects.
 */

// Re-export generated native tokens with a typed shape
import { nativeTokens as _nativeTokens } from '../dist/native.js';

export interface NativeTokens {
  color: Record<string, string>;
  radius: Record<string, number>;
  spacing: Record<string, number>;
  typography: {
    header: { family: string; weight: Record<string, number> };
    body: { family: string; weight: Record<string, number> };
    scale: Record<string, { size: number; lineHeight: number }>;
  };
  shadow: {
    card: ShadowTokenValue;
    fab: ShadowTokenValue;
    [key: string]: ShadowTokenValue;
  };
  zIndex: Record<string, number>;
}

export const nativeTokens = _nativeTokens as unknown as NativeTokens;

// ---------------------------------------------------------------------------
// RN shadow helper
// ---------------------------------------------------------------------------

/**
 * Shadow token value as produced by the native/shadow-to-rn transform.
 * Matches what Style Dictionary emits into dist/native.js.
 */
export interface ShadowTokenValue {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * React Native shadow style object shape (for use in StyleSheet.create).
 */
export interface RNShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * Creates a React Native shadow style from a shadow token value.
 *
 * Usage:
 * ```ts
 * import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
 * const cardStyle = createShadowStyle(nativeTokens.shadow.card);
 * ```
 */
export function createShadowStyle(token: ShadowTokenValue): RNShadowStyle {
  return {
    shadowColor: token.shadowColor,
    shadowOffset: token.shadowOffset,
    shadowOpacity: token.shadowOpacity,
    shadowRadius: token.shadowRadius,
    elevation: token.elevation,
  };
}
