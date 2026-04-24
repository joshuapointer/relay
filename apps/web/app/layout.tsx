import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';

import QueryProvider from '@/components/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Relay — Shipment Tracking',
  description:
    'Relay gives you real-time visibility into every shipment, powered by Trusted Clarity.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body bg-background text-text antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-1 focus:text-sm focus:text-primary focus:ring-2 focus:ring-accent"
        >
          Skip to main content
        </a>
        <ClerkProvider>
          <QueryProvider>{children}</QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
