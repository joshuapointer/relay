'use client';

import { BrandLogo } from '@relay/ui-core';
import { signIn } from 'next-auth/react';
import { useEffect } from 'react';

// Authentik hosts both sign-in and sign-up flows via the same OIDC endpoint.
export default function SignUpPage() {
  useEffect(() => {
    void signIn('authentik', { callbackUrl: '/dashboard' });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8">
        <BrandLogo variant="default" height={36} />
      </div>
      <div className="w-full max-w-sm rounded-xl bg-surface p-8 shadow-card text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden="true"
        />
        <p className="font-heading text-base font-semibold text-ink">Creating your account…</p>
        <p className="font-body mt-1 text-sm text-textMuted">
          Redirecting to your identity provider
        </p>
      </div>
    </div>
  );
}
