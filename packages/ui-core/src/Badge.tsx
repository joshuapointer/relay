import { tokens } from './tokens.js';

export interface BadgeProps {
  /** Label text for the badge */
  label: string;
  /** Optional color override (defaults to ink) */
  color?: string;
  /** Optional background color override (defaults to neutral/cloudGray) */
  backgroundColor?: string;
}

/**
 * Badge — small label primitive for metadata (delivery date, carrier badge).
 * Renders as a small pill with neutral background by default.
 */
export function Badge({ label, color, backgroundColor }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: tokens.radius.pill,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 8,
        paddingRight: 8,
        backgroundColor: backgroundColor ?? tokens.color.neutral,
        color: color ?? tokens.color.ink,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: '18px',
      }}
    >
      {label}
    </span>
  );
}
