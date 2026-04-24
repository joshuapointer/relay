/**
 * BrandWordmark — "Relay" text lockup
 *
 * BR-8: reads "Relay" — uppercase R, lowercase elay, single word.
 * BR-9: Poppins Bold, clean modern slightly-rounded geometric sans.
 * BR-13: minimum 24px tall.
 *
 * Renders as an inline SVG containing a <text> element with Poppins Bold.
 * SVG approach keeps it composable with Icon in Logo without DOM nesting issues.
 *
 * Props:
 *   height  — element height in px (default 32; minimum 24 per BR-13)
 *   color   — fill color override (default: #1A1A1A Ink Black)
 *   variant — 'default' | 'light' (light = white fill)
 */

export interface BrandWordmarkProps {
  /** Height in pixels. Minimum 24px per BR-13. Default: 32 */
  height?: number;
  /** Fill color override. Default: #1A1A1A (Ink Black) */
  color?: string;
  /** 'default' = Ink Black; 'light' = White. */
  variant?: 'default' | 'light';
  /** Extra CSS class name */
  className?: string;
  /**
   * Text fallback label for environments where the SVG text is not readable.
   * Defaults to "Relay". Exposed as aria-label on the SVG.
   */
  fallbackLabel?: string;
}

const INK = '#1A1A1A';
const WHITE = '#FFFFFF';

// The wordmark viewBox is fixed-aspect: 120w × 48h
// Text baseline at y=36, font-size=32 gives comfortable cap-height + descender room
const VIEW_W = 120;
const VIEW_H = 48;

export function BrandWordmark({
  height = 32,
  color,
  variant = 'default',
  className,
  fallbackLabel = 'Relay',
}: BrandWordmarkProps) {
  const clampedHeight = Math.max(24, height);
  const width = (clampedHeight / VIEW_H) * VIEW_W;

  const fill = color ?? (variant === 'light' ? WHITE : INK);

  return (
    <svg
      width={width}
      height={clampedHeight}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={fallbackLabel}
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      <title>{fallbackLabel}</title>
      <text
        x="4"
        y="36"
        fontFamily="Poppins, 'Inter', system-ui, sans-serif"
        fontWeight="700"
        fontSize="32"
        letterSpacing="-0.5"
        fill={fill}
      >
        Relay
      </text>
    </svg>
  );
}

export default BrandWordmark;
