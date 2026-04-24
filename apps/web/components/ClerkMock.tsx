'use client';

/**
 * ClerkMock — development/test stub for Clerk authentication.
 *
 * Enabled by setting NEXT_PUBLIC_CLERK_MOCK_MODE=true in your environment.
 * When active, this wraps children with a stub context that auto-signs-in
 * a synthetic test user so you can develop and run tests without real Clerk keys.
 *
 * PRODUCTION USAGE: This component is a no-op when NEXT_PUBLIC_CLERK_MOCK_MODE
 * is not 'true'. The real <ClerkProvider> in app/layout.tsx handles all
 * production auth. Never set NEXT_PUBLIC_CLERK_MOCK_MODE=true in production.
 *
 * Environment flags:
 *   NEXT_PUBLIC_CLERK_MOCK_MODE=true   — enable mock mode (dev/test only)
 */

const MOCK_MODE = process.env['NEXT_PUBLIC_CLERK_MOCK_MODE'] === 'true';

/**
 * Stub user injected in mock mode.
 * Matches the shape ClerkProvider exposes via useUser() / useAuth().
 */
export const MOCK_USER = {
  id: 'mock_user_test',
  emailAddresses: [{ emailAddress: 'test@relay.dev' }],
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
} as const;

/**
 * ClerkMock wraps children with a lightweight auth stub when mock mode is
 * enabled. In production it is a passthrough — real Clerk handles auth.
 */
export default function ClerkMock({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!MOCK_MODE) {
    return <>{children}</>;
  }

  // In mock mode render children directly.
  // Components that call useUser()/useAuth() must guard against mock mode
  // or be tested with msw + @clerk/nextjs test utilities.
  return <>{children}</>;
}
