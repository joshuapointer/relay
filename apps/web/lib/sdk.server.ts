/**
 * Server-side SDK client.
 * Reads the Clerk session token from the server auth() helper.
 * Use this in Server Components and Route Handlers only.
 */
import { auth } from '@clerk/nextjs/server';
import { createRelayClient } from '@relay/sdk';

export function getServerSdkClient() {
  return createRelayClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    getAuthToken: async () => {
      try {
        const { getToken } = await auth();
        return await getToken();
      } catch {
        return null;
      }
    },
  });
}
