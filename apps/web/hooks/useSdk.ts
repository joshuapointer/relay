'use client';

import { useAuth } from '@clerk/nextjs';
import type { RelayClient } from '@relay/sdk';
import { useMemo } from 'react';

import { initSdkClient } from '@/lib/sdk.client';

/**
 * Returns a memoized SDK client wired to the current Clerk session token.
 * Must be used inside a component that is a descendant of <ClerkProvider>.
 */
export function useSdk(): RelayClient {
  const { getToken } = useAuth();
  return useMemo(() => initSdkClient(() => getToken()), [getToken]);
}
