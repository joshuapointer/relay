import { statusColor, type DisplayShipmentStatus } from './tokens.js';

export interface StatusPillProps {
  status: DisplayShipmentStatus;
}

/**
 * StatusPill — renders a color-coded pill for shipment status.
 *
 * BR-1: Delivered uses success green #2ECC71 (ONLY this status).
 * BR-2: In Transit uses accent amber #FFB800.
 * Accessibility: text label always present (AC-9: color never sole indicator).
 *
 * Web-only component (jsdom-compatible). Mobile version is identical logic
 * but with RN View/Text — WS-C will wire RNTL tests separately.
 */
export function StatusPill({ status }: StatusPillProps) {
  const color = statusColor(status);

  return (
    <span
      role="status"
      aria-label={status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 12,
        paddingRight: 12,
        backgroundColor: hexWithAlpha(color, 0.15),
      }}
    >
      <span
        style={{
          color,
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {status}
      </span>
    </span>
  );
}

/**
 * Convert a hex color + alpha to rgba() for the pill background.
 */
function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r.toString()}, ${g.toString()}, ${b.toString()}, ${alpha.toString()})`;
}
