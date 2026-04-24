/**
 * Shipment detail screen — WS-C-03.
 *
 * Sections:
 *  - Hero: StatusPill + tracking number + carrier
 *  - ETA card (if present)
 *  - Tracking timeline
 *  - Map placeholder
 *  - Actions: Share + Delete
 *
 * Data: TanStack Query (refetchInterval 30s) + Socket.IO via useShipmentSubscription.
 */
import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
import type { TrackingEvent } from '@relay/shared-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../../components/ErrorState.native';
import { SkeletonCard } from '../../../components/SkeletonCard.native';
import { StatusPill } from '../../../components/StatusPill.native';
import { DETAIL } from '../../../constants/strings';
import { useShipmentSubscription } from '../../../lib/realtime';
import { useSdk } from '../../../lib/sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return 'moments ago';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TimelineEvent({ event }: { event: TrackingEvent }) {
  return (
    <View style={styles.timelineItem} accessible accessibilityRole="text">
      <View style={styles.timelineDot} />
      <View style={styles.timelineBody}>
        <Text style={styles.timelineStatus}>{event.status}</Text>
        <Text style={styles.timelineDesc}>{event.description}</Text>
        {event.location != null && (
          <Text style={styles.timelineLocation}>{event.location}</Text>
        )}
        <Text style={styles.timelineTime}>{formatRelativeTime(event.occurredAt)}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sdk = useSdk();
  const shadowStyle = createShadowStyle(nativeTokens.shadow.card);

  // Real-time subscription
  useShipmentSubscription(id);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => sdk.shipments.get(id!),
    enabled: id != null,
    refetchInterval: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: () => sdk.shipments.delete(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shipments'] });
      router.back();
    },
  });

  const handleShare = useCallback(async () => {
    if (data == null) return;
    try {
      const link = await sdk.shipments.createShareLink(data.id);
      await Share.share({
        message: `Track my shipment on Relay: ${link.url}`,
        url: link.url,
      });
    } catch {
      // User cancelled or share failed — no action needed
    }
  }, [data, sdk]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      DETAIL.deleteConfirmTitle,
      DETAIL.deleteConfirmBody,
      [
        { text: DETAIL.deleteCancel, style: 'cancel' },
        {
          text: DETAIL.deleteConfirmAction,
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  }, [deleteMutation]);

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Shipment</Text>
          <View style={styles.headerRight} />
        </View>
        <SkeletonCard testID="skeleton-0" />
        <SkeletonCard testID="skeleton-1" />
        <SkeletonCard testID="skeleton-2" />
      </SafeAreaView>
    );
  }

  if (isError || data == null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Shipment</Text>
          <View style={styles.headerRight} />
        </View>
        <ErrorState
          testID="error-state"
          message={DETAIL.errorLoad}
          onRetry={() => void refetch()}
        />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Loaded state
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Shipment</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>

        {/* Hero card */}
        <View style={[styles.card, shadowStyle]}>
          <StatusPill status={data.status} testID="status-pill" />

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>{DETAIL.sectionTracking}</Text>
          <Text style={styles.trackingNumber} selectable testID="tracking-number">
            {data.trackingNumber}
          </Text>

          <Text style={styles.fieldLabel}>{DETAIL.sectionCarrier}</Text>
          <Text style={styles.fieldValue}>{data.carrier.displayName}</Text>
        </View>

        {/* ETA card */}
        {data.eta != null && (
          <View style={[styles.card, shadowStyle]}>
            <Text style={styles.fieldLabel}>{DETAIL.sectionEta}</Text>
            <Text style={styles.etaValue} testID="eta-value">
              {DETAIL.etaFormat(formatDate(data.eta))}
            </Text>
          </View>
        )}

        {/* Tracking timeline */}
        <Text style={styles.sectionTitle}>{DETAIL.sectionTimeline}</Text>
        <View style={[styles.card, shadowStyle]}>
          {data.events.length === 0 ? (
            <Text style={styles.placeholderText}>{DETAIL.noTimeline}</Text>
          ) : (
            data.events.map((event) => (
              <TimelineEvent key={event.id} event={event} />
            ))
          )}
        </View>

        {/* Map placeholder */}
        <Text style={styles.sectionTitle}>{DETAIL.sectionMap}</Text>
        <View style={[styles.mapPlaceholder, shadowStyle]}>
          <Text style={styles.mapPlaceholderText}>{DETAIL.mapPlaceholder}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.shareButton,
              pressed && styles.pressed,
            ]}
            onPress={() => void handleShare()}
            accessibilityRole="button"
            accessibilityLabel={DETAIL.shareButton}
            testID="share-button"
          >
            <Text style={styles.shareButtonText}>{DETAIL.shareButton}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.deleteButton,
              pressed && styles.pressed,
            ]}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={DETAIL.deleteButton}
            testID="delete-button"
          >
            <Text style={styles.deleteButtonText}>{DETAIL.deleteButton}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: nativeTokens.color.neutral },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: nativeTokens.color.surface,
    borderBottomWidth: 1,
    borderBottomColor: nativeTokens.color.border,
  },
  backButton: { flex: 1, minHeight: 44, justifyContent: 'center' },
  backText: { color: nativeTokens.color.primary, fontSize: 16 },
  headerTitle: {
    flex: 2,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: nativeTokens.color.ink,
  },
  headerRight: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: nativeTokens.color.surface,
    borderRadius: nativeTokens.radius.md,
    padding: 16,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: nativeTokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: nativeTokens.color.ink,
  },
  trackingNumber: {
    fontSize: 15,
    color: nativeTokens.color.ink,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: nativeTokens.color.border,
    marginVertical: 12,
  },
  etaValue: {
    fontSize: 17,
    fontWeight: '600',
    color: nativeTokens.color.ink,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: nativeTokens.color.ink,
    marginBottom: 8,
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: nativeTokens.color.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  mapPlaceholder: {
    backgroundColor: nativeTokens.color.neutral,
    borderRadius: nativeTokens.radius.md,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: nativeTokens.color.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: nativeTokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  shareButton: {
    backgroundColor: nativeTokens.color.primary,
  },
  shareButtonText: {
    color: nativeTokens.color.white,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: nativeTokens.color.exception,
  },
  deleteButtonText: {
    color: nativeTokens.color.exception,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: { opacity: 0.8 },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: nativeTokens.color.secondary,
    marginTop: 4,
    marginRight: 12,
  },
  timelineBody: { flex: 1 },
  timelineStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: nativeTokens.color.ink,
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 14,
    color: nativeTokens.color.ink,
    lineHeight: 20,
  },
  timelineLocation: {
    fontSize: 12,
    color: nativeTokens.color.secondary,
    marginTop: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: nativeTokens.color.textMuted,
    marginTop: 4,
  },
});
