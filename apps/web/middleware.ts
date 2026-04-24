export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/shipments/:path*',
    '/settings/:path*',
    '/notifications/:path*',
  ],
};
