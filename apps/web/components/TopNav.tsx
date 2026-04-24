'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { BrandLogo } from '@relay/ui-core';
import { signOut, useSession } from 'next-auth/react';

/**
 * TopNav — Deep Tech Blue header (BR-30).
 * Uses BrandLogo variant="light" (white icon + white wordmark on dark bg).
 */
export default function TopNav() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? 'Account';
  const initial = name.charAt(0).toUpperCase();

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
      <Menu as="div" className="relative">
        <MenuButton
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-body text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Account menu"
        >
          {initial}
        </MenuButton>
        <MenuItems
          anchor="bottom end"
          className="z-50 mt-2 w-56 origin-top-right rounded-md bg-surface p-1 shadow-fab focus:outline-none"
        >
          <div className="px-3 py-2">
            <p className="font-body text-sm font-medium text-ink">{name}</p>
            {session?.user?.email != null && (
              <p className="font-body text-xs text-textMuted">{session.user.email}</p>
            )}
          </div>
          <MenuItem>
            <button
              type="button"
              onClick={() => {
                void signOut({ callbackUrl: '/' });
              }}
              className="block w-full rounded-md px-3 py-2 text-left font-body text-sm text-ink data-[focus]:bg-neutral"
            >
              Sign out
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </header>
  );
}
