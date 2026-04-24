'use client';

/**
 * Browser-side SDK client.
 * getAuthToken is wired to Clerk's useAuth().getToken() via the
 * getSdkClient() helper below, which must be called inside a React
 * component or hook that has Clerk context.
 *
 * For React components use useSdkClient() hook instead.
 */
import { createRelayClient } from '@relay/sdk';
import type { RelayClient } from '@relay/sdk';

let _client: RelayClient | null = null;
let _getToken: (() => Promise<string | null>) | null = null;

export function initSdkClient(getToken: () => Promise<string | null>): RelayClient {
  if (_client === null || _getToken !== getToken) {
    _getToken = getToken;
    _client = createRelayClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
      getAuthToken: getToken,
    });
  }
  return _client;
}

export function getSdkClient(): RelayClient {
  if (_client === null) {
    // Return a no-op client before Clerk initializes — queries will fail
    // gracefully because getAuthToken returns null.
    _client = createRelayClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
      getAuthToken: async () => null,
    });
  }
  return _client;
}
