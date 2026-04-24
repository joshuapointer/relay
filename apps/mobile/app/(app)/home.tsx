/**
 * Home screen — BR-24..BR-29:
 * - BrandHeader (icon + wordmark) top-left on white background
 * - Greeting: "Welcome back, [Name]" in Inter Regular (BR-25)
 * - Status filter tabs (horizontal scroll)
 * - FlatList of TrackingCards via TanStack Query sdk.shipments.list
 * - Pull-to-refresh
 * - Empty, loading (skeleton), error states
 * - FAB bottom-right, Deep Tech Blue 56px, navigates to /(app)/add (BR-29)
 */
import type { DisplayShipmentStatus } from '@relay/design-tokens';
import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
import type { Shipment } from '@relay/shared-types';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '../../components/BrandHeader.native';
import { useMockAuth } from '../../components/ClerkMock';
import { EmptyState } from '../../components/EmptyState.native';
import { ErrorState } from '../../components/ErrorState.native';
import { FAB } from '../../components/FAB';
import { SkeletonCard } from '../../components/SkeletonCard.native';
import { TrackingCard } from '../../components/TrackingCard';
import { HOME } from '../../constants/strings';
import { useSdk } from '../../lib/sdk';

// ---------------------------------------------------------------------------
// Filter tab definitions
// ---------------------------------------------------------------------------
type FilterValue = 'All' | DisplayShipmentStatus;

const FILTERS: FilterValue[] = [
  'All',
  'Pending',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Exception',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const sdk = useSdk();
  const [activeFilter, setActiveFilter] = useState<FilterValue>('All');
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.firstName ?? 'there';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shipments', activeFilter],
    queryFn: () =>
      sdk.shipments.list(
        activeFilter !== 'All' ? { status: activeFilter } : undefined,
      ),
    staleTime: 30_000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const shadowStyle = createShadowStyle(nativeTokens.shadow.card);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderItem({ item }: { item: Shipment }) {
    return (
      <Pressable
        onPress={() => router.push(`/(app)/shipments/${item.id}` as never)}
        accessibilityRole="button"
        accessibilityLabel={`Shipment ${item.nickname ?? item.trackingNumber}`}
      >
        <TrackingCard
          trackingNumber={item.trackingNumber}
          carrier={item.carrier.displayName}
          status={item.status}
          {...(item.nickname !== undefined && { nickname: item.nickname })}
        />
      </Pressable>
    );
  }

  function renderContent() {
    if (isLoading && !refreshing) {
      return (
        <View testID="loading-state">
          <SkeletonCard testID="skeleton-0" />
          <SkeletonCard testID="skeleton-1" />
          <SkeletonCard testID="skeleton-2" />
        </View>
      );
    }

    if (isError) {
      return (
        <ErrorState
          testID="error-state"
          message="Unable to load shipments. Pull down to try again."
          onRetry={() => void refetch()}
        />
      );
    }

    const items = data?.items ?? [];

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            testID="empty-state"
            title={HOME.emptyTitle}
            body={HOME.emptyBody}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header — BR-24 */}
      <View style={styles.header}>
        <BrandHeader testID="brand-header" />
      </View>

      {/* Greeting — BR-25 */}
      <Text style={styles.greeting} testID="greeting">
        {HOME.greeting(firstName)}
      </Text>

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[
              styles.filterTab,
              activeFilter === f && styles.filterTabActive,
              activeFilter === f && shadowStyle,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Filter: ${f}`}
            accessibilityState={{ selected: activeFilter === f }}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === f && styles.filterTabTextActive,
              ]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Main content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* FAB — BR-29 */}
      <FAB
        testID="home-fab"
        onPress={() => router.push('/(app)/add' as never)}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: nativeTokens.color.neutral,
  },
  header: {
    backgroundColor: nativeTokens.color.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: nativeTokens.color.border,
  },
  greeting: {
    fontSize: 18,
    color: nativeTokens.color.ink,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    fontWeight: '400',
    // Ideally: fontFamily: 'Inter-Regular'
  },
  filterScroll: {
    flexGrow: 0,
    paddingTop: 12,
    paddingBottom: 4,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: nativeTokens.radius.pill,
    backgroundColor: nativeTokens.color.surface,
    borderWidth: 1,
    borderColor: nativeTokens.color.border,
  },
  filterTabActive: {
    backgroundColor: nativeTokens.color.primary,
    borderColor: nativeTokens.color.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: nativeTokens.color.textMuted,
  },
  filterTabTextActive: {
    color: nativeTokens.color.white,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 100, // space for FAB
  },
  listEmpty: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
  },
});
