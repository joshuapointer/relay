import { NextResponse, type NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const MOCK_MODE = process.env.NEXT_PUBLIC_CLERK_MOCK_MODE === 'true';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/share/(.*)',
]);

// Only construct the real Clerk middleware when we have real credentials.
// Calling clerkMiddleware at module scope with a placeholder key throws
// "Publishable key not valid" on every request.
const realMiddleware = MOCK_MODE
  ? null
  : clerkMiddleware((auth, request) => {
      if (!isPublicRoute(request)) {
        auth().protect();
      }
    });

export default async function middleware(req: NextRequest, ev: unknown) {
  if (!realMiddleware) return NextResponse.next();
  return (realMiddleware as unknown as (r: NextRequest, e: unknown) => Promise<Response>)(
    req,
    ev,
  );
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
