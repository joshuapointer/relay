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
| `AUTHENTIK_ISSUER` | Authentik OIDC issuer URL (ends with trailing slash) |
| `AUTHENTIK_CLIENT_ID` | OAuth2 client id from the Authentik provider |
| `AUTHENTIK_CLIENT_SECRET` | OAuth2 client secret |
| `NEXTAUTH_URL` | Public base URL of this app (e.g. `https://relay.example.com`) |
| `NEXTAUTH_SECRET` | Random 32-byte secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_API_URL` | Relay API base URL (default: `http://localhost:4000`) |
| `NEXT_PUBLIC_WS_URL` | Socket.IO server URL (default: `http://localhost:4000`) |

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

## Authentication

The web app uses [NextAuth v4](https://next-auth.js.org/) with the Authentik
provider. Sign-in is hosted by Authentik; on success the Authentik
`access_token` is persisted on the JWT session and forwarded as a Bearer
token to the Relay API (which validates the same RS256 signature against the
Authentik JWKS).
