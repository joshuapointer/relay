/**
 * StatusPill.native.tsx — Native implementation of the status pill.
 *
 * Web-first ui-core/StatusPill uses SVG which is not guaranteed on native.
 * This local implementation uses RN View/Text + design-token colors.
 *
 * Matches semantic colors:
 *  Delivered       → #2ECC71 (success green — BR-1: only this status)
 *  In Transit      → #FFB800 (accent amber — BR-2)
 *  Out for Delivery→ #FFB800 (accent amber)
 *  Pending         → #B38600 (amber dim)
 *  Exception       → #D97706 (amber + border tone)
 *
 * Accessibility: pill includes accessibilityRole="text" and the label so
 * screen readers announce status without relying on color (AC-9).
 */
import { statusColor, type DisplayShipmentStatus } from '@relay/design-tokens';
import { nativeTokens } from '@relay/design-tokens/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusPillProps {
  status: DisplayShipmentStatus;
  testID?: string;
}

export function StatusPill({ status, testID }: StatusPillProps) {
  const color = statusColor(status);
  const bgColor = color + '22'; // 13% opacity tint

  return (
    <View
      style={[styles.pill, { backgroundColor: bgColor }]}
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status: ${status}`}
    >
      <Text style={[styles.label, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: nativeTokens.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
