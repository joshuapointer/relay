# @relay/web

Next.js 14 (App Router) web app for Relay shipment tracking.

## Setup

```bash
# From monorepo root
pnpm install

# Or filter to this package
pnpm --filter @relay/web install
```

## Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key from dashboard.clerk.com |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side only) |
| `NEXT_PUBLIC_API_URL` | Relay API base URL (default: `http://localhost:4000`) |
| `NEXT_PUBLIC_WS_URL` | Socket.IO server URL (default: `http://localhost:4000`) |
| `NEXT_PUBLIC_CLERK_MOCK_MODE` | Set `true` to bypass Clerk with a stub test user (dev/test only) |

## Dev commands

```bash
# Start dev server on port 3000
pnpm --filter @relay/web dev

# Type-check
pnpm --filter @relay/web typecheck

# Lint
pnpm --filter @relay/web lint

# Unit tests (Vitest)
pnpm --filter @relay/web test

# E2E tests (Playwright) — requires dev server running
pnpm --filter @relay/web dev   # terminal 1
pnpm --filter @relay/web test:e2e  # terminal 2

# Production build
pnpm --filter @relay/web build
```

## Mock mode

Set `NEXT_PUBLIC_CLERK_MOCK_MODE=true` (already the default in `.env.example`) to run without real Clerk keys. The `ClerkMock` component in `components/ClerkMock.tsx` auto-signs-in a synthetic test user so every authenticated route is accessible.

**Never enable mock mode in production.**
