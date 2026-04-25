'use client';

import { BrandLogo } from '@relay/ui-core';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void signIn('authentik', { callbackUrl: '/dashboard' }).catch(() => {
      setError('Could not start sign-in. Please try again.');
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8">
        <BrandLogo variant="default" height={36} />
      </div>

      <div className="w-full max-w-sm rounded-xl bg-surface p-8 shadow-card text-center">
        {error == null ? (
          <>
            {/* Spinner */}
            <div
              className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
              aria-hidden="true"
            />
            <p className="font-heading text-base font-semibold text-ink">Signing you in…</p>
            <p className="font-body mt-1 text-sm text-textMuted">
              Redirecting to your identity provider
            </p>
          </>
        ) : (
          <>
            <p className="font-heading mb-1 text-base font-semibold text-exception">
              Sign-in failed
            </p>
            <p className="font-body mb-4 text-sm text-textMuted">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                void signIn('authentik', { callbackUrl: '/dashboard' });
              }}
              className="rounded-md bg-primary px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
