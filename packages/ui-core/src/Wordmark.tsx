import { tokens } from './tokens.js';

export interface WordmarkProps {
  /** Color override — defaults to ink (#1A1A1A) */
  color?: string;
  /** Height in pixels — minimum 24px per BR-13 */
  height?: number;
}

/**
 * Wordmark — text-based "Relay" placeholder per BR-5..BR-10.
 *
 * - BR-8: reads "Relay" — uppercase R, lowercase elay, single word.
 * - BR-9: Poppins Bold, clean modern slightly-rounded sans-serif.
 * - BR-13: minimum 24px tall.
 *
 * Note: Real SVG logo/icon lockup arrives via WS-D-03a.
 * This placeholder matches brand case/font so consumers can use it now.
 */
export function Wordmark({ color, height = 32 }: WordmarkProps) {
  const fontSize = height * 0.75;

  return (
    <span
      aria-label="Relay"
      style={{
        display: 'inline-block',
        fontFamily: 'Poppins, system-ui, sans-serif',
        fontWeight: 700,
        fontSize,
        lineHeight: `${height.toString()}px`,
        color: color ?? tokens.color.ink,
        letterSpacing: '-0.01em',
        userSelect: 'none',
      }}
    >
      Relay
    </span>
  );
}
