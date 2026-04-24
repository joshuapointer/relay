'use client';

import type { RelayClient } from '@relay/sdk';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

import { initSdkClient } from '@/lib/sdk.client';

/**
 * Returns a memoized SDK client wired to the current NextAuth session token.
 * The accessToken is the Authentik access_token persisted in the JWT callback.
 */
export function useSdk(): RelayClient {
  const { data: session } = useSession();
  const token = session?.accessToken ?? null;
  return useMemo(() => initSdkClient(async () => token), [token]);
}
