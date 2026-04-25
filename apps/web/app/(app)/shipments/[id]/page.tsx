'use client';

import { StatusPill } from '@relay/ui-core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { ShareDialog } from '@/components/ShareDialog';
import { SkeletonList } from '@/components/SkeletonCard';
import { useSdk } from '@/hooks/useSdk';
import { useShipmentSubscription } from '@/lib/realtime';

interface PageProps {
  params: { id: string };
}

function formatDateTime(iso: string | null): string {
  if (iso == null) return '—';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
}

export default function ShipmentDetailPage({ params }: PageProps) {
  const { id } = params;
  const sdk = useSdk();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  // Subscribe to real-time updates; invalidates query on shipment:updated
  useShipmentSubscription(id);

  const { data: session, status: sessionStatus } = useSession();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => sdk.shipments.get(id),
    refetchInterval: 30_000,
    enabled: sessionStatus === 'authenticated' && Boolean(session?.accessToken),
  });

  const deleteMutation = useMutation({
    mutationFn: () => sdk.shipments.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shipments'] });
      router.push('/dashboard');
    },
  });

  function handleCopy() {
    if (data == null) return;
    copyToClipboard(data.trackingNumber);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  }

  if (isLoading) {
    return (
      <div id="main-content" className="flex h-[calc(100vh-56px)] flex-col md:flex-row">
        <div className="w-full bg-neutral p-6 md:w-2/5">
          <SkeletonList count={4} />
        </div>
        <div className="flex w-full flex-1 items-center justify-center bg-neutral/50 md:w-3/5">
          <p className="font-body text-base text-textMuted">Map visualization — coming soon</p>
        </div>
      </div>
    );
  }

  if (isError || data == null) {
    return (
      <div id="main-content" className="mx-auto max-w-lg p-8">
        <ErrorState
          message="Could not load shipment details."
          onRetry={() => { void refetch(); }}
        />
      </div>
    );
  }

  return (
    <>
      <div id="main-content" className="flex h-[calc(100vh-56px)] flex-col md:flex-row">
        {/* Info panel — 40% width, Cloud Gray background (BR-30, BR-32) */}
        <div className="flex w-full flex-col overflow-y-auto bg-neutral p-6 md:w-2/5">
          {/* Header: nickname or tracking number — Poppins SemiBold (BR-33) */}
          <h1 className="font-heading mb-3 text-xl font-semibold text-ink">
            {data.nickname ?? data.trackingNumber}
          </h1>

          {/* Status + last event */}
          <div className="mb-4 flex items-center gap-3">
            <StatusPill status={data.status} />
            <span className="font-body text-xs text-textMuted">
              {formatDateTime(data.lastEventAt)}
            </span>
          </div>

          {/* Carrier + tracking number */}
          <div className="mb-4 rounded-lg bg-surface p-4 shadow-card">
            <p className="font-body mb-0.5 text-xs font-medium uppercase tracking-wide text-textMuted">
              Carrier
            </p>
            <p className="font-heading mb-3 text-sm font-semibold text-ink">
              {data.carrier.displayName}
            </p>
            <p className="font-body mb-0.5 text-xs font-medium uppercase tracking-wide text-textMuted">
              Tracking number
            </p>
            <div className="flex items-center gap-2">
              <span className="font-body text-sm text-ink">{data.trackingNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy tracking number"
                className="rounded px-2 py-0.5 font-body text-xs text-primary transition-colors hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* ETA */}
          {data.eta != null && (
            <div className="mb-4 rounded-lg bg-surface p-4 shadow-card">
              <p className="font-body mb-0.5 text-xs font-medium uppercase tracking-wide text-textMuted">
                Estimated delivery
              </p>
              <p className="font-body text-sm text-ink">{formatDateTime(data.eta)}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mb-6 flex gap-3">
            <button
              type="button"
              onClick={() => { setShareOpen(true); }}
              className="flex-1 rounded-md border border-border bg-surface px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => { setConfirmDelete(true); }}
              className="flex-1 rounded-md border border-exception/40 bg-surface px-4 py-2 font-body text-sm font-medium text-exception transition-colors hover:bg-exception/5 focus:outline-none focus:ring-2 focus:ring-exception focus:ring-offset-2"
            >
              Delete
            </button>
          </div>

          {/* Delete confirmation */}
          {confirmDelete && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              className="mb-4 rounded-lg border border-exception/30 bg-surface p-4 shadow-card"
            >
              <p id="delete-title" className="font-heading mb-1 text-sm font-semibold text-ink">
                Delete this shipment?
              </p>
              <p className="font-body mb-3 text-xs text-textMuted">
                This removes the shipment from your account. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(false); }}
                  className="flex-1 rounded border border-border px-3 py-1.5 font-body text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => { deleteMutation.mutate(); }}
                  className="flex-1 rounded bg-exception px-3 py-1.5 font-body text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-exception focus:ring-offset-1 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
              {deleteMutation.isError && (
                <p role="alert" className="mt-2 font-body text-xs text-exception">
                  Failed to delete. Please try again.
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div>
            <h2 className="font-heading mb-3 text-base font-semibold text-ink">Timeline</h2>
            {data.events.length === 0 ? (
              <p className="font-body text-sm text-textMuted">No tracking events yet.</p>
            ) : (
              <ol aria-label="Tracking events" className="relative flex flex-col gap-4 border-l-2 border-border pl-4">
                {data.events.map((event, idx) => {
                  const isCurrent = idx === 0;
                  const isDelivered = event.status === 'Delivered';
                  const highlightClass = isCurrent
                    ? isDelivered
                      ? 'border-success bg-success/10'
                      : 'border-accent bg-accent/10'
                    : 'border-border bg-surface';

                  return (
                    <li
                      key={event.id}
                      className={`rounded-lg border p-3 shadow-card ${highlightClass}`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <StatusPill status={event.status} />
                        <span className="font-body text-xs text-textMuted">
                          {formatDateTime(event.occurredAt)}
                        </span>
                      </div>
                      <p className="font-body text-sm text-ink">{event.description}</p>
                      {event.location != null && (
                        <p className="font-body mt-0.5 text-xs text-secondary">{event.location}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Map placeholder — 60% width (BR-31) */}
        <div className="flex w-full flex-1 items-center justify-center bg-neutral/50 md:w-3/5">
          <p className="font-body text-base text-textMuted">Map visualization — coming soon</p>
        </div>
      </div>

      {/* Share dialog */}
      <ShareDialog
        shipmentId={id}
        isOpen={shareOpen}
        onClose={() => { setShareOpen(false); }}
      />
    </>
  );
}
