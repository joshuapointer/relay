/**
 * Server-side SDK client.
 * Reads the access token from the NextAuth session.
 * Use this in Server Components and Route Handlers only.
 */
import { createRelayClient } from '@relay/sdk';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';

export function getServerSdkClient() {
  return createRelayClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    getAuthToken: async () => {
      try {
        const session = await getServerSession(authOptions);
        return session?.accessToken ?? null;
      } catch {
        return null;
      }
    },
  });
}
