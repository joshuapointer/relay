/**
 * EmptyState.native.tsx — Empty list state component.
 */
import { nativeTokens } from '@relay/design-tokens/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  title?: string;
  body?: string;
  testID?: string;
}

export function EmptyState({
  title = 'No shipments yet.',
  body = 'Tap + to add your first package.',
  testID,
}: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID} accessible accessibilityRole="text">
      {/* Graphic placeholder */}
      <View style={styles.graphic}>
        <Text style={styles.graphicIcon}>📦</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  graphic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: nativeTokens.color.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  graphicIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: nativeTokens.color.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: nativeTokens.color.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
