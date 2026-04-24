/**
 * Server-side no-op Clerk shim. Aliased to @clerk/nextjs/server when
 * NEXT_PUBLIC_CLERK_MOCK_MODE=true.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function auth() {
  return {
    userId: null as string | null,
    sessionId: null as string | null,
    getToken: async (): Promise<string | null> => null,
    protect: () => undefined,
  };
}

type MiddlewareHandler = (
  auth: () => ReturnType<typeof authMiddleware>,
  request: NextRequest,
) => Promise<Response | void> | Response | void;

function authMiddleware() {
  return {
    userId: null as string | null,
    protect: () => undefined,
  };
}

export function clerkMiddleware(_handler?: MiddlewareHandler) {
  return (_request: NextRequest) => NextResponse.next();
}

export function createRouteMatcher(_patterns: string[]) {
  return (_request: NextRequest) => false;
}
