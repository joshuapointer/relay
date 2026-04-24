'use client';

import type { DisplayShipmentStatus } from '@relay/shared-types';
import { StatusPill } from '@relay/ui-core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonList } from '@/components/SkeletonCard';
import { useSdk } from '@/hooks/useSdk';

const STATUS_TABS: Array<{ label: string; value: DisplayShipmentStatus | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Transit', value: 'In Transit' },
  { label: 'Out for Delivery', value: 'Out for Delivery' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Exception', value: 'Exception' },
];

function formatDate(iso: string | null): string {
  if (iso == null) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function DashboardPage() {
  const sdk = useSdk();
  const [activeTab, setActiveTab] = useState<DisplayShipmentStatus | 'All'>('All');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shipments', activeTab],
    queryFn: () =>
      sdk.shipments.list(
        activeTab === 'All' ? undefined : { status: activeTab },
      ),
    refetchInterval: 30_000,
  });

  const shipments = data?.items ?? [];

  return (
    <div id="main-content" className="mx-auto max-w-4xl px-4 py-8">
      {/* Heading — Poppins SemiBold per BR-34 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-ink">Shipments</h1>
      </div>

      {/* Tab filters */}
      <div
        role="tablist"
        aria-label="Filter shipments by status"
        className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-neutral p-1"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            type="button"
            onClick={() => { setActiveTab(tab.value); }}
            className={[
              'shrink-0 rounded px-3 py-1.5 font-body text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1',
              activeTab === tab.value
                ? 'bg-surface text-primary shadow-card'
                : 'text-textMuted hover:text-ink',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && <SkeletonList count={3} />}

      {isError && (
        <ErrorState
          message="Could not load shipments. Check your connection and try again."
          onRetry={() => { void refetch(); }}
        />
      )}

      {!isLoading && !isError && shipments.length === 0 && (
        <EmptyState
          title="No shipments yet."
          description="Track your first package."
          action={
            <Link
              href="/shipments/new"
              className="inline-block rounded-md bg-primary px-5 py-2.5 font-body text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              Add tracking
            </Link>
          }
        />
      )}

      {!isLoading && !isError && shipments.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Shipments list">
          {shipments.map((shipment) => (
            <li key={shipment.id}>
              <Link
                href={`/shipments/${shipment.id}`}
                className="block rounded-lg bg-surface p-4 shadow-card transition-shadow hover:shadow-fab focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                <div className="mb-2 flex items-center gap-3">
                  <StatusPill status={shipment.status} />
                  <span className="font-body text-xs text-textMuted">
                    {formatDate(shipment.lastEventAt)}
                  </span>
                </div>

                <p className="font-heading mb-0.5 text-sm font-semibold text-ink">
                  {shipment.nickname ?? shipment.trackingNumber}
                </p>

                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-textMuted">
                    {shipment.carrier.displayName}
                  </span>
                  <span className="text-border" aria-hidden="true">·</span>
                  <span className="font-body text-xs text-textMuted">
                    {shipment.trackingNumber}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* FAB — fixed bottom-right, navigates to add shipment */}
      <Link
        href="/shipments/new"
        aria-label="Add shipment"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-fab transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        <span aria-hidden="true">+</span>
      </Link>
    </div>
  );
}
