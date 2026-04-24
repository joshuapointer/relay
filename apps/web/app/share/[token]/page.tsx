/**
 * Public share view — server component, no auth required.
 * AC-10: shows status + timeline only — no owner PII.
 */
import type { DisplayShipmentStatus } from '@relay/shared-types';
import { StatusPill } from '@relay/ui-core';

import { getServerSdkClient } from '@/lib/sdk.server';

interface PageProps {
  params: { token: string };
}

function maskTrackingNumber(tracking: string): string {
  if (tracking.length <= 4) return '****';
  return `****${tracking.slice(-4)}`;
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

export default async function SharePage({ params }: PageProps) {
  const { token } = params;
  const sdk = getServerSdkClient();

  let data: Awaited<ReturnType<typeof sdk.share.get>> | null = null;
  let notFound = false;
  let expired = false;

  try {
    data = await sdk.share.get(token);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 410) {
      expired = true;
    } else {
      notFound = true;
    }
  }

  if (expired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral p-8">
        <div className="w-full max-w-md rounded-xl bg-surface p-8 text-center shadow-card">
          <p className="font-heading text-xl font-semibold text-ink">
            This tracking link has expired.
          </p>
          <p className="font-body mt-2 text-sm text-textMuted">
            Ask the sender to generate a new share link.
          </p>
        </div>
      </main>
    );
  }

  if (notFound || data == null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral p-8">
        <div className="w-full max-w-md rounded-xl bg-surface p-8 text-center shadow-card">
          <p className="font-heading text-xl font-semibold text-ink">
            Tracking link not found.
          </p>
          <p className="font-body mt-2 text-sm text-textMuted">
            This link may have been removed or never existed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral">
      {/* Simple header */}
      <header
        className="flex h-14 items-center px-4 shadow-card"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <span className="font-heading text-lg font-semibold text-white">Relay</span>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-2 flex items-center gap-3">
          <StatusPill status={data.status as DisplayShipmentStatus} />
        </div>

        <h1 className="font-heading mb-6 text-2xl font-semibold text-ink">
          Shipment tracking
        </h1>

        {/* Shipment info card — no PII */}
        <div className="mb-6 rounded-lg bg-surface p-5 shadow-card">
          <div className="mb-3">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-textMuted">
              Carrier
            </p>
            <p className="font-heading text-sm font-semibold text-ink">
              {data.carrier.displayName}
            </p>
          </div>

          <div className="mb-3">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-textMuted">
              Tracking number (last 4)
            </p>
            <p className="font-body text-sm text-ink">
              {maskTrackingNumber(data.trackingNumber)}
            </p>
          </div>

          {data.eta != null && (
            <div>
              <p className="font-body text-xs font-medium uppercase tracking-wide text-textMuted">
                Estimated delivery
              </p>
              <p className="font-body text-sm text-ink">{formatDateTime(data.eta)}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <h2 className="font-heading mb-4 text-lg font-semibold text-ink">Timeline</h2>

        {data.recentEvents.length === 0 ? (
          <p className="font-body text-sm text-textMuted">No tracking events yet.</p>
        ) : (
          <ol
            aria-label="Recent tracking events"
            className="relative flex flex-col gap-4 border-l-2 border-border pl-4"
          >
            {data.recentEvents.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-border bg-surface p-4 shadow-card"
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
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
