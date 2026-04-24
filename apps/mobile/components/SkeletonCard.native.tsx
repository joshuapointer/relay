/**
 * SkeletonCard.native.tsx — Loading placeholder card for shipment list.
 * Three of these are rendered while the shipments query is loading.
 */
import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface SkeletonCardProps {
  testID?: string;
}

const SHIMMER = nativeTokens.color.neutral;
const SHIMMER_DARK = '#e2e5ea';

export function SkeletonCard({ testID }: SkeletonCardProps) {
  const shadowStyle = createShadowStyle(nativeTokens.shadow.card);

  return (
    <View style={[styles.card, shadowStyle]} testID={testID} accessibilityLabel="Loading shipment">
      {/* Icon placeholder */}
      <View style={styles.iconBox} />

      <View style={styles.content}>
        {/* Title line */}
        <View style={[styles.line, styles.lineWide, { backgroundColor: SHIMMER_DARK }]} />
        {/* Subtitle line */}
        <View style={[styles.line, styles.lineMid, { backgroundColor: SHIMMER }]} />
        {/* Pill placeholder */}
        <View style={[styles.pill, { backgroundColor: SHIMMER }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: nativeTokens.color.surface,
    borderRadius: nativeTokens.radius.md,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: nativeTokens.radius.md,
    backgroundColor: SHIMMER,
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  lineWide: {
    width: '70%',
  },
  lineMid: {
    width: '45%',
  },
  pill: {
    width: 72,
    height: 20,
    borderRadius: nativeTokens.radius.pill,
  },
});
