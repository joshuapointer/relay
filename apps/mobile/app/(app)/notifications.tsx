/**
 * Notifications screen — lists current user's notifications.
 * Tap a notification to mark it read. "Mark all read" button in header.
 */
import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
import type { Notification } from '@relay/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/EmptyState.native';
import { ErrorState } from '../../components/ErrorState.native';
import { SkeletonCard } from '../../components/SkeletonCard.native';
import { useSdk } from '../../lib/sdk';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const sdk = useSdk();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const shadowStyle = createShadowStyle(nativeTokens.shadow.card);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => sdk.notifications.list(),
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => sdk.notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => sdk.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => n.readAt === null);

  const renderItem = ({ item }: { item: Notification }) => {
    const unread = item.readAt === null;
    return (
      <Pressable
        onPress={() => {
          if (unread) markRead.mutate(item.id);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}${unread ? ', unread' : ''}`}
        style={[
          styles.card,
          shadowStyle,
          unread && styles.cardUnread,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {unread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardBody} numberOfLines={3}>
          {item.body}
        </Text>
        <Text style={styles.cardTime}>{formatWhen(item.createdAt)}</Text>
      </Pressable>
    );
  };

  function renderContent() {
    if (isLoading && !refreshing) {
      return (
        <View testID="notif-loading">
          <SkeletonCard testID="skeleton-0" />
          <SkeletonCard testID="skeleton-1" />
        </View>
      );
    }
    if (isError) {
      return (
        <ErrorState
          testID="notif-error"
          message="Unable to load notifications. Pull down to try again."
          onRetry={() => void refetch()}
        />
      );
    }
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
            testID="notif-empty"
            title="You're all caught up."
            body="Updates about your shipments will appear here."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>Notifications</Text>
        <Pressable
          onPress={() => markAllRead.mutate()}
          disabled={!hasUnread || markAllRead.isPending}
          accessibilityRole="button"
          accessibilityLabel="Mark all read"
          testID="mark-all-read"
          style={({ pressed }) => [
            styles.action,
            (!hasUnread || markAllRead.isPending) && styles.actionDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.actionText}>
            {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: nativeTokens.color.neutral },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: nativeTokens.color.surface,
    borderBottomWidth: 1,
    borderBottomColor: nativeTokens.color.border,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: nativeTokens.color.ink,
  },
  action: {
    borderWidth: 1,
    borderColor: nativeTokens.color.border,
    borderRadius: nativeTokens.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionDisabled: { opacity: 0.4 },
  actionText: {
    color: nativeTokens.color.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  pressed: { opacity: 0.75 },
  content: { flex: 1, paddingTop: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  listEmpty: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: nativeTokens.color.surface,
    borderRadius: nativeTokens.radius.md,
    padding: 16,
    marginBottom: 12,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: nativeTokens.color.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: nativeTokens.color.ink,
  },
  badge: {
    backgroundColor: nativeTokens.color.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: nativeTokens.radius.pill,
  },
  badgeText: {
    color: nativeTokens.color.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBody: {
    fontSize: 14,
    color: nativeTokens.color.ink,
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 12,
    color: nativeTokens.color.textMuted,
  },
});
