'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';

import { useSdk } from '@/hooks/useSdk';

export interface ShareDialogProps {
  shipmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TTL_OPTIONS = [
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
] as const;

/**
 * ShareDialog — modal to create a share link for a shipment.
 * AC-10: share links reveal status + timeline only — no PII.
 */
export function ShareDialog({ shipmentId, isOpen, onClose }: ShareDialogProps) {
  const sdk = useSdk();
  const [ttlDays, setTtlDays] = useState<number>(7);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleClose() {
    setShareUrl(null);
    setError(null);
    setCopied(false);
    onClose();
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const result = await sdk.shipments.createShareLink(shipmentId, { ttlDays });
      setShareUrl(result.url);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        setError('Too many share links today — try again tomorrow.');
      } else {
        setError('Failed to create share link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (shareUrl == null) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink/40" aria-hidden="true" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md rounded-xl bg-surface p-6 shadow-fab">
              <Dialog.Title className="font-heading mb-1 text-lg font-semibold text-ink">
                Share tracking link
              </Dialog.Title>
              <p className="font-body mb-5 text-sm text-textMuted">
                Generate a read-only link. No personal information is shared.
              </p>

              {shareUrl == null ? (
                <>
                  {/* TTL select */}
                  <div className="mb-5">
                    <label
                      htmlFor="share-ttl"
                      className="font-body mb-1 block text-sm font-medium text-ink"
                    >
                      Link expires after
                    </label>
                    <select
                      id="share-ttl"
                      value={ttlDays}
                      onChange={(e) => { setTtlDays(Number(e.target.value)); }}
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    >
                      {TTL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error != null && (
                    <p role="alert" className="font-body mb-4 text-sm text-exception">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 rounded-md border border-border px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => { void handleCreate(); }}
                      disabled={loading}
                      className="flex-1 rounded-md bg-primary px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50"
                    >
                      {loading ? 'Creating…' : 'Create link'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-body mb-2 text-sm font-medium text-ink">Your share link:</p>
                  <div className="mb-5 flex items-center gap-2 rounded-md border border-border bg-neutral p-3">
                    <span className="font-body flex-1 truncate text-sm text-ink" aria-label="Share link URL">
                      {shareUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => { void handleCopy(); }}
                      className="shrink-0 rounded px-3 py-1 font-body text-xs font-medium text-primary transition-colors hover:bg-border/30 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full rounded-md border border-border px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  >
                    Done
                  </button>
                </>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
