/**
 * TrackingCard — elevated white card skeleton
 * BR-26/BR-27: shadow from tokens, status pill color-mapped via statusColor(),
 * location line in Agile Teal #00C2CB.
 */
import { statusColor, type DisplayShipmentStatus } from '@relay/design-tokens';
import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TrackingCardProps {
  trackingNumber: string;
  carrier?: string;
  status: DisplayShipmentStatus;
  location?: string;
  nickname?: string;
  onPress?: () => void;
}

export function TrackingCard({
  trackingNumber,
  carrier,
  status,
  location,
  nickname,
}: TrackingCardProps) {
  const shadowStyle = createShadowStyle(nativeTokens.shadow.card);
  const pillColor = statusColor(status);

  return (
    <View style={[styles.card, shadowStyle]}>
      {/* Icon placeholder */}
      <View style={styles.iconPlaceholder}>
        <Text style={styles.iconText}>📦</Text>
      </View>

      <View style={styles.content}>
        {nickname ? (
          <Text style={styles.nickname} numberOfLines={1}>
            {nickname}
          </Text>
        ) : null}
        <Text style={styles.trackingNumber} numberOfLines={1}>
          {trackingNumber}
        </Text>
        {carrier ? (
          <Text style={styles.carrier}>{carrier}</Text>
        ) : null}

        {/* Status pill */}
        <View style={[styles.pill, { backgroundColor: pillColor + '20' }]}>
          <Text style={[styles.pillText, { color: pillColor }]}>{status}</Text>
        </View>

        {/* Location in Agile Teal */}
        {location ? (
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        ) : null}
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
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: nativeTokens.radius.md,
    backgroundColor: nativeTokens.color.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '600',
    color: nativeTokens.color.ink,
    marginBottom: 2,
  },
  trackingNumber: {
    fontSize: 13,
    color: nativeTokens.color.textMuted,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  carrier: {
    fontSize: 12,
    color: nativeTokens.color.textMuted,
    marginBottom: 4,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: nativeTokens.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  location: {
    fontSize: 12,
    color: nativeTokens.color.secondary, // Agile Teal #00C2CB
    marginTop: 2,
  },
});
