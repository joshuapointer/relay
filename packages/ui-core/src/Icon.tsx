
export interface IconProps {
  /** Icon size in pixels (width and height). Default: 24 */
  size?: number;
  /** Icon fill/stroke color. Default: currentColor */
  color?: string;
  /** When true, aria-hidden is set and the icon is decorative only */
  decorative?: boolean;
  /** Accessible label when decorative=false */
  label?: string;
}

/**
 * Icon — placeholder stub.
 *
 * Real SVG icon (stylized R with arrow + package, per BR-14..BR-18)
 * arrives via WS-D-03a. This stub renders a small box so consumers
 * can wire it now and swap internals later without API changes.
 *
 * Accepts size, color, decorative props — same interface the real icon will use.
 */
export function Icon({ size = 24, color = 'currentColor', decorative = true, label }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={decorative || undefined}
      aria-label={!decorative ? label : undefined}
      role={!decorative ? 'img' : undefined}
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      {/* Placeholder: small rounded rectangle — replaced by WS-D-03a */}
      <rect x="4" y="4" width="16" height="16" rx="3" ry="3" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
