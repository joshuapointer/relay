'use client';

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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="rounded-lg bg-surface p-6 shadow-card">
        <p className="font-body text-sm text-textMuted">
          {error ?? 'Redirecting to sign-in…'}
        </p>
        {error !== null && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              void signIn('authentik', { callbackUrl: '/dashboard' });
            }}
            className="mt-4 rounded-md bg-primary px-4 py-2 font-body text-sm font-medium text-white"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
