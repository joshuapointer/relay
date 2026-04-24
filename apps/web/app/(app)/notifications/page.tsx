'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/SkeletonCard';
import { useSdk } from '@/hooks/useSdk';

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function NotificationsPage() {
  const sdk = useSdk();
  const qc = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => sdk.notifications.list(),
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => sdk.notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => {
      setActionError('Could not mark notification read. Try again.');
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => sdk.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => {
      setActionError('Could not mark all notifications read. Try again.');
    },
  });

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => n.readAt === null);

  return (
    <div id="main-content" className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-ink">Notifications</h1>
        <button
          type="button"
          disabled={!hasUnread || markAllRead.isPending}
          onClick={() => {
            setActionError(null);
            markAllRead.mutate();
          }}
          className="rounded-md border border-border px-3 py-1.5 font-body text-sm font-medium text-ink transition-colors hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-40"
        >
          {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
        </button>
      </div>

      {actionError !== null && (
        <p role="alert" className="mb-4 font-body text-sm text-exception">
          {actionError}
        </p>
      )}

      {isLoading && <SkeletonList count={3} />}

      {isError && (
        <ErrorState
          message="Could not load notifications. Check your connection and try again."
          onRetry={() => { void refetch(); }}
        />
      )}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="You're all caught up."
          description="Updates about your shipments will appear here."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Notifications list">
          {items.map((n) => {
            const unread = n.readAt === null;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (unread) {
                      setActionError(null);
                      markRead.mutate(n.id);
                    }
                  }}
                  className={[
                    'block w-full rounded-lg bg-surface p-4 text-left shadow-card transition-shadow hover:shadow-fab focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                    unread ? 'border-l-4 border-primary' : '',
                  ].join(' ')}
                  aria-label={`${n.title}${unread ? ' (unread)' : ''}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="font-heading text-sm font-semibold text-ink">
                      {n.title}
                    </p>
                    {unread && (
                      <span
                        aria-label="Unread"
                        className="shrink-0 rounded-full bg-primary px-2 py-0.5 font-body text-[10px] font-medium uppercase text-white"
                      >
                        New
                      </span>
                    )}
                  </div>
                  <p className="font-body mb-2 text-sm text-ink">{n.body}</p>
                  <p className="font-body text-xs text-textMuted">
                    {formatWhen(n.createdAt)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
