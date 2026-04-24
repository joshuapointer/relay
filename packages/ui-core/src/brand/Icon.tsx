/**
 * BrandIcon — Relay brand mark (stylized R → arrow → package)
 *
 * Inline SVG, no network fetch required.
 * BR-11 continuity verified by designer: R-tail flows into arrow line into package.
 * BR-14..BR-18: continuous line art, rounded corners, single weight stroke.
 *
 * Props:
 *   size    — width & height in px (default 24)
 *   color   — stroke color override (default: Deep Tech Blue #003B73)
 *   variant — 'default' | 'light' (light = white + Agile Teal accent)
 */

export interface BrandIconProps {
  /** Width and height in pixels. Default: 24 */
  size?: number;
  /** Stroke color override. Default: #003B73 (Deep Tech Blue) */
  color?: string;
  /** 'default' uses Deep Tech Blue; 'light' uses white + Agile Teal accent. */
  variant?: 'default' | 'light';
  /** Extra CSS class name */
  className?: string;
}

/** Deep Tech Blue — primary brand color token */
const PRIMARY = '#003B73';
/** Agile Teal — accent for arrow + package in light variant */
const TEAL = '#00C2CB';
/** White — for light variant stem/bowl */
const WHITE = '#FFFFFF';

export function BrandIcon({
  size = 24,
  color,
  variant = 'default',
  className,
}: BrandIconProps) {
  const isLight = variant === 'light';

  // Stem + bowl color: explicit color prop wins; otherwise variant-based
  const stemColor = color ?? (isLight ? WHITE : PRIMARY);
  // Arrow + package accent: Agile Teal in light variant, same as stem in default
  const accentColor = isLight ? TEAL : (color ?? PRIMARY);

  // Scale stroke-width proportionally from 48-viewBox base of 4px
  const sw = (4 * size) / 48;
  const swPkg = (3 * size) / 48;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Relay"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      <title>Relay</title>

      {/*
        Main continuous line: vertical stem → bowl (R top loop) → crossbar →
        diagonal tail (BR-11: tail extends directly into arrow line)
        BR-17: single continuous stroke, no breaks
        BR-18: soft rounded corners via Q bezier + round caps/joins
      */}
      <path
        d="M10 40 L10 10 Q10 6 14 6 L26 6 Q34 6 34 14 Q34 22 26 22 L10 22 L28 38"
        stroke={stemColor}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Arrow shaft — extends from tail end (BR-15) */}
      <line
        x1={28} y1={38}
        x2={36} y2={38}
        stroke={accentColor}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Arrowhead — forward-pointing right (BR-15) */}
      <polyline
        points="32,32 40,38 32,44"
        stroke={accentColor}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Package — small rect enclosed by/near arrowhead tip (BR-16) */}
      <rect
        x={37} y={34}
        width={6} height={8}
        rx={1.5} ry={1.5}
        stroke={accentColor}
        strokeWidth={swPkg}
        fill="none"
      />
    </svg>
  );
}

export default BrandIcon;
