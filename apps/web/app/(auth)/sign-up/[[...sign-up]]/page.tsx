'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';

// Authentik hosts both sign-in and sign-up flows; redirect through the same
// authorization endpoint.
export default function SignUpPage() {
  useEffect(() => {
    void signIn('authentik', { callbackUrl: '/dashboard' });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-body text-sm text-textMuted">Redirecting to sign-up…</p>
    </div>
  );
}
