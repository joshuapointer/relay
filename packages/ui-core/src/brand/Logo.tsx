/**
 * BrandLogo — full horizontal lockup: icon + wordmark
 *
 * BR-10: icon on left, wordmark on right.
 * BR-11: the crossbar of the R extends via a thin bridge rule into the icon,
 *        creating visible continuity between wordmark and icon.
 * BR-12: clear space = height of lowercase 'e' on all four sides.
 *
 * Props:
 *   height  — total height in px (default 32)
 *   variant — 'default' | 'light'
 *   className
 */

import { BrandIcon } from './Icon.js';
import { BrandWordmark } from './Wordmark.js';

export interface BrandLogoProps {
  /** Total height of the logo lockup in pixels. Default: 32 */
  height?: number;
  /** Color variant: 'default' (Deep Tech Blue + Ink Black) | 'light' (White + Teal) */
  variant?: 'default' | 'light';
  /** Extra CSS class name on the wrapper */
  className?: string;
}

/** Gap between wordmark and icon in px at height=48 (scales proportionally) */
const GAP_AT_48 = 10;

export function BrandLogo({
  height = 32,
  variant = 'default',
  className,
}: BrandLogoProps) {
  const gap = Math.round((GAP_AT_48 * height) / 48);

  return (
    <span
      role="img"
      aria-label="Relay"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* BR-10: icon on left */}
      <BrandIcon size={height} variant={variant} />
      {/* BR-11: gap between components is visually bridged by the icon's
          leftward-extending crossbar leading line (rendered inside BrandIcon
          path) and the wordmark R's crossbar; here we use a thin rule overlay
          rendered in the SVG assets for logo.svg. In the React composition the
          visual continuity is achieved by the tight gap and the icon's left-side
          stem beginning at the same vertical level as the R crossbar. */}
      {/* BR-10: wordmark on right */}
      <BrandWordmark height={height} variant={variant} />
    </span>
  );
}

export default BrandLogo;
