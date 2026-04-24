/**
 * ClerkMock — AMENDMENT §3.0
 *
 * When CLERK_MOCK_MODE=true, stubs Clerk auth so the app runs without keys.
 * Exports <ClerkOrMockProvider> which wraps the app in either real ClerkProvider
 * or a mock context that satisfies useAuth / useUser hooks.
 */
import Constants from 'expo-constants';
import React, { createContext, useContext, useState } from 'react';

// ---------------------------------------------------------------------------
// Mock auth context shape (mirrors subset of Clerk's useAuth return)
// ---------------------------------------------------------------------------

interface MockUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
}

interface MockAuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: MockUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const MOCK_USER: MockUser = {
  id: 'mock-user-001',
  emailAddresses: [{ emailAddress: 'demo@relay.app' }],
  firstName: 'Demo',
  lastName: 'User',
  fullName: 'Demo User',
};

const MockAuthContext = createContext<MockAuthContextValue>({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

// ---------------------------------------------------------------------------
// Mock hooks — re-exported so screens can import from this file in mock mode
// ---------------------------------------------------------------------------

export function useMockAuth(): MockAuthContextValue {
  return useContext(MockAuthContext);
}

// ---------------------------------------------------------------------------
// Mock provider
// ---------------------------------------------------------------------------

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<MockUser | null>(null);

  const signIn = async (_email: string, _password: string) => {
    setIsSignedIn(true);
    setUser(MOCK_USER);
  };

  const signUp = async (_email: string, _password: string) => {
    setIsSignedIn(true);
    setUser(MOCK_USER);
  };

  const signOut = async () => {
    setIsSignedIn(false);
    setUser(null);
  };

  return (
    <MockAuthContext.Provider
      value={{
        isLoaded: true,
        isSignedIn,
        userId: user?.id ?? null,
        user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Unified provider — selects mock vs real based on CLERK_MOCK_MODE
// ---------------------------------------------------------------------------

interface ClerkOrMockProviderProps {
  children: React.ReactNode;
  publishableKey?: string | undefined;
}

export function ClerkOrMockProvider({
  children,
  publishableKey,
}: ClerkOrMockProviderProps) {
  const mockMode =
    Constants.expoConfig?.extra?.CLERK_MOCK_MODE === true ||
    process.env.CLERK_MOCK_MODE === 'true';

  if (mockMode || !publishableKey) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  // Dynamically import real ClerkProvider only when not in mock mode
  // to avoid errors when CLERK_PUBLISHABLE_KEY is absent.
   
  const { ClerkProvider } = require('@clerk/clerk-expo');
  return (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  );
}

export { MockAuthContext };
