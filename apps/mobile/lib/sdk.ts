/**
 * lib/sdk.ts — Relay SDK singleton for mobile.
 *
 * Creates a RelayClient instance configured with:
 *  - baseUrl from expo-constants extra.apiUrl, falling back to localhost:4000
 *  - getAuthToken from Clerk-expo useAuth().getToken() or mock token in mock mode
 *
 * useSdk() returns the singleton client.
 */
import { createRelayClient, type RelayClient } from '@relay/sdk';
import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Mock token support
// ---------------------------------------------------------------------------

function isMockMode(): boolean {
  return (
    Constants.expoConfig?.extra?.CLERK_MOCK_MODE === true ||
    process.env.CLERK_MOCK_MODE === 'true'
  );
}

async function getMockToken(): Promise<string> {
  return 'mock-auth-token';
}

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

const baseUrl: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000';

let _getAuthToken: () => Promise<string | null> = getMockToken;

/**
 * Register the Clerk getToken function once the auth hook is available.
 * Called from the root layout after Clerk is initialized.
 */
export function setAuthTokenProvider(fn: () => Promise<string | null>): void {
  if (!isMockMode()) {
    _getAuthToken = fn;
  }
}

const sdk: RelayClient = createRelayClient({
  baseUrl,
  getAuthToken: () => _getAuthToken(),
});

/**
 * Returns the Relay SDK client singleton.
 */
export function useSdk(): RelayClient {
  return sdk;
}

export { sdk };
