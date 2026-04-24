import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/share/(.*)',
]);

// Clerk requires a valid publishable key at init time. In mock/no-creds
// deployments the key is absent or the literal string "placeholder"; fall
// through to a no-op middleware so the app can still render public pages.
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const clerkKeyIsReal = /^pk_(test|live)_/.test(publishableKey);

export default clerkKeyIsReal
  ? clerkMiddleware((auth, request) => {
      if (!isPublicRoute(request)) {
        auth().protect();
      }
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
