'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { BrandLogo } from '@relay/ui-core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import { useSdk } from '@/hooks/useSdk';

/**
 * TopNav — Deep Tech Blue header (BR-30).
 * Uses BrandLogo variant="light" (white icon + white wordmark on dark bg).
 */
export default function TopNav() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? 'Account';
  const initial = name.charAt(0).toUpperCase();
  const pathname = usePathname();
  const sdk = useSdk();

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => sdk.notifications.list({ unread: true }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const unreadCount = notifData?.items.filter((n) => n.readAt === null).length ?? 0;
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  const iconClass = (href: string) =>
    pathname === href ? 'text-white' : 'text-white/70 hover:text-white';

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
      <Link href="/dashboard" aria-label="Go to dashboard">
        <BrandLogo variant="light" height={28} />
      </Link>

      {/* Right-side controls */}
      <div className="flex items-center gap-1">
        {/* Bell — notifications */}
        <Link
          href="/notifications"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white ${iconClass('/notifications')}`}
        >
          {/* Bell SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-exception px-0.5 text-[10px] font-medium leading-none text-white"
            >
              {badgeLabel}
            </span>
          )}
        </Link>

        {/* Settings gear */}
        <Link
          href="/settings"
          aria-label="Settings"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white ${iconClass('/settings')}`}
        >
          {/* Gear SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>

        {/* User avatar menu */}
        <Menu as="div" className="relative ml-1">
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
      </div>
    </header>
  );
}
