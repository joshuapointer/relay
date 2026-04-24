'use client';

import { UserButton } from '@clerk/nextjs';
import { BrandLogo } from '@relay/ui-core';

/**
 * TopNav — Deep Tech Blue header (BR-30).
 * Uses BrandLogo variant="light" (white icon + white wordmark on dark bg).
 */
export default function TopNav() {
  return (
    <header
      className="flex h-14 items-center justify-between px-4 shadow-card"
      style={{ backgroundColor: 'var(--color-primary)' }}
      data-testid="top-nav"
    >
      {/* Skip-nav target */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-1 focus:text-sm focus:text-primary focus:ring-2 focus:ring-accent"
      >
        Skip to main content
      </a>

      {/* BrandLogo — light variant for dark nav background (BR-30) */}
      <BrandLogo variant="light" height={28} />

      {/* User controls */}
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
