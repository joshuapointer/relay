/**
 * StatusPill.native.tsx tests — Delivered → green, In Transit → amber.
 */
import { render } from '@testing-library/react-native';
import React from 'react';

// ── Design tokens mock ───────────────────────────────────────────────────────
jest.mock('@relay/design-tokens/native', () => ({
  nativeTokens: {
    color: {
      primary: '#003b73',
      secondary: '#00c2cb',
      surface: '#ffffff',
      neutral: '#f4f6f9',
      ink: '#1a1a1a',
      white: '#ffffff',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      exception: '#d97706',
    },
    radius: { md: 8, pill: 999 },
    shadow: {
      card: {
        shadowColor: 'rgba(26,26,26,0.08)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
      },
    },
  },
  createShadowStyle: (t: Record<string, unknown>) => t,
}));

jest.mock('@relay/design-tokens', () => ({
  statusColor: (status: string) => {
    const map: Record<string, string> = {
      Delivered: '#2ECC71',
      'In Transit': '#FFB800',
      'Out for Delivery': '#FFB800',
      Pending: '#B38600',
      Exception: '#D97706',
    };
    return map[status] ?? '#6b7280';
  },
}));

import { StatusPill } from '../components/StatusPill.native';

import type { DisplayShipmentStatus } from '@relay/design-tokens';

describe('StatusPill', () => {
  it('renders "Delivered" label', () => {
    const { getByText } = render(
      <StatusPill status={'Delivered' as DisplayShipmentStatus} testID="pill" />,
    );
    expect(getByText('Delivered')).toBeTruthy();
  });

  it('Delivered → green text color (#2ECC71)', () => {
    const { getByText } = render(
      <StatusPill status={'Delivered' as DisplayShipmentStatus} testID="pill" />,
    );
    const label = getByText('Delivered');
    const flatStyle = label.props.style;
    const styles: Record<string, unknown>[] = Array.isArray(flatStyle)
      ? (flatStyle as unknown[]).flat(Infinity) as Record<string, unknown>[]
      : [flatStyle as Record<string, unknown>];
    const colorStyle = styles.find(
      (s) => s && typeof s === 'object' && 'color' in s,
    ) as Record<string, unknown> | undefined;
    expect(colorStyle?.color).toBe('#2ECC71');
  });

  it('In Transit → amber text color (#FFB800)', () => {
    const { getByText } = render(
      <StatusPill status={'In Transit' as DisplayShipmentStatus} testID="pill" />,
    );
    const label = getByText('In Transit');
    const flatStyle = label.props.style;
    const styles: Record<string, unknown>[] = Array.isArray(flatStyle)
      ? (flatStyle as unknown[]).flat(Infinity) as Record<string, unknown>[]
      : [flatStyle as Record<string, unknown>];
    const colorStyle = styles.find(
      (s) => s && typeof s === 'object' && 'color' in s,
    ) as Record<string, unknown> | undefined;
    expect(colorStyle?.color).toBe('#FFB800');
  });

  it('Exception → amber/border color (#D97706)', () => {
    const { getByText } = render(
      <StatusPill status={'Exception' as DisplayShipmentStatus} testID="pill" />,
    );
    const label = getByText('Exception');
    const flatStyle = label.props.style;
    const styles: Record<string, unknown>[] = Array.isArray(flatStyle)
      ? (flatStyle as unknown[]).flat(Infinity) as Record<string, unknown>[]
      : [flatStyle as Record<string, unknown>];
    const colorStyle = styles.find(
      (s) => s && typeof s === 'object' && 'color' in s,
    ) as Record<string, unknown> | undefined;
    expect(colorStyle?.color).toBe('#D97706');
  });

  it('has accessible label including status text', () => {
    const { getByTestId } = render(
      <StatusPill status={'Pending' as DisplayShipmentStatus} testID="pill" />,
    );
    const pill = getByTestId('pill');
    expect(pill.props.accessibilityLabel).toBe('Status: Pending');
  });

  it('renders all five status values without crashing', () => {
    const statuses: DisplayShipmentStatus[] = [
      'Pending',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Exception',
    ];
    statuses.forEach((status) => {
      const { getByText } = render(<StatusPill status={status} />);
      expect(getByText(status)).toBeTruthy();
    });
  });
});
