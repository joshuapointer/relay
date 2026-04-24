/**
 * No-op Clerk shim. Next.js aliases @clerk/nextjs to this file when
 * NEXT_PUBLIC_CLERK_MOCK_MODE=true so the app renders without real keys.
 * Every exported symbol matches the subset of @clerk/nextjs the app actually
 * imports; everything returns sensible defaults (signed out, no user).
 */
import type { ReactNode } from 'react';

type AuthState = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const STUB_AUTH: AuthState = {
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  getToken: async () => null,
  signOut: async () => undefined,
};

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth(): AuthState {
  return STUB_AUTH;
}

export function useUser() {
  return { isLoaded: true, isSignedIn: false, user: null };
}

export function useSession() {
  return { isLoaded: true, isSignedIn: false, session: null };
}

export function useClerk() {
  return {
    signOut: async () => undefined,
    openSignIn: () => undefined,
    openSignUp: () => undefined,
  };
}

export function SignedIn({ children: _c }: { children: ReactNode }) {
  return null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function UserButton() {
  return null;
}

export function SignIn() {
  return <div>Sign-in disabled (mock mode)</div>;
}

export function SignUp() {
  return <div>Sign-up disabled (mock mode)</div>;
}
