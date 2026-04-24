'use client';

import { useClerk } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { useSdk } from '@/hooks/useSdk';

const DELETE_CONFIRM_WORD = 'DELETE';

export default function SettingsPage() {
  const sdk = useSdk();
  const { signOut } = useClerk();
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => sdk.profile.get(),
  });

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await sdk.profile.delete();
      await signOut();
      router.push('/');
    } catch {
      setDeleteError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div id="main-content" className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-heading mb-8 text-2xl font-semibold text-ink">Settings</h1>

      {/* Profile section */}
      <section aria-labelledby="profile-heading" className="mb-8">
        <h2
          id="profile-heading"
          className="font-heading mb-4 text-lg font-semibold text-ink"
        >
          Profile
        </h2>

        <div className="rounded-lg bg-surface p-6 shadow-card">
          {isLoading && (
            <div className="animate-pulse">
              <div className="mb-2 h-4 w-32 rounded bg-neutral" />
              <div className="h-4 w-48 rounded bg-neutral" />
            </div>
          )}

          {isError && (
            <ErrorState message="Could not load profile." />
          )}

          {profile != null && (
            <div className="flex flex-col gap-2">
              <div>
                <p className="font-body text-xs font-medium uppercase tracking-wide text-textMuted">
                  Email
                </p>
                <p className="font-body text-sm text-ink">{profile.email}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Notifications placeholder */}
      <section aria-labelledby="notif-heading" className="mb-8">
        <h2
          id="notif-heading"
          className="font-heading mb-4 text-lg font-semibold text-ink"
        >
          Notifications
        </h2>
        <div className="rounded-lg bg-surface p-6 shadow-card">
          <p className="font-body text-sm text-textMuted">
            Manage notifications — coming soon.
          </p>
        </div>
      </section>

      {/* Danger zone */}
      <section aria-labelledby="danger-heading">
        <h2
          id="danger-heading"
          className="font-heading mb-4 text-lg font-semibold text-exception"
        >
          Danger zone
        </h2>

        <div className="rounded-lg border border-exception/30 bg-surface p-6 shadow-card">
          <p className="font-heading mb-1 text-sm font-semibold text-ink">Delete account</p>
          <p className="font-body mb-4 text-sm text-textMuted">
            Deleting your account removes all shipments, notifications, and share links.
            This cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => { setShowDeleteModal(true); }}
            className="rounded-md border border-exception/40 px-4 py-2 font-body text-sm font-medium text-exception transition-colors hover:bg-exception/5 focus:outline-none focus:ring-2 focus:ring-exception focus:ring-offset-2"
          >
            Delete my account
          </button>
        </div>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-fab">
            <h3
              id="delete-modal-title"
              className="font-heading mb-2 text-lg font-semibold text-ink"
            >
              Delete your account?
            </h3>

            <p className="font-body mb-4 text-sm text-textMuted">
              Deleting your account removes all shipments, notifications, and share links.
              This cannot be undone. Your data will be permanently deleted within 30 days.
            </p>

            <p className="font-body mb-2 text-sm text-ink">
              Type <strong>DELETE</strong> to confirm:
            </p>

            {/* autoFocus is intentional — traps focus in the modal for a11y */}
            <input
              autoFocus
              type="text"
              value={confirmInput}
              onChange={(e) => { setConfirmInput(e.target.value); }}
              aria-label="Type DELETE to confirm account deletion"
              className="mb-4 w-full rounded-md border border-border px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-exception focus:ring-offset-2"
              autoComplete="off"
            />

            {deleteError != null && (
              <p role="alert" className="mb-3 font-body text-sm text-exception">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmInput('');
                  setDeleteError(null);
                }}
                className="flex-1 rounded-md border border-border px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmInput !== DELETE_CONFIRM_WORD || deleting}
                onClick={() => { void handleDeleteAccount(); }}
                className="flex-1 rounded-md bg-exception px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-exception focus:ring-offset-2 disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
