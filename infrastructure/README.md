# Relay — Deployment Runbook

This document covers deploying each Relay service to production. All commands assume you are in the repo root.

---

## Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed and authenticated (`fly auth login`)
- [Vercel CLI](https://vercel.com/docs/cli) installed and authenticated (`vercel login`)
- [EAS CLI](https://docs.expo.dev/eas/cli/) installed and authenticated (`eas login`)
- [pnpm](https://pnpm.io/) >= 9
- Node 20

---

## External services setup

### Database — Neon (Postgres)
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string for the `main` branch
3. Set it as `DATABASE_URL` in Fly secrets (API) and in local `.env`

### Cache / Pub-Sub — Upstash Redis
1. Create a database at [upstash.com](https://upstash.com)
2. Copy the Redis connection string
3. Set it as `SOCKET_IO_REDIS_URL` in Fly secrets

### Auth — Clerk
1. Create an application at [clerk.com](https://clerk.com)
2. Copy Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Vercel + mobile `.env`)
3. Copy Secret Key → `CLERK_SECRET_KEY` (Fly secrets)
4. Copy JWKS URL → `CLERK_JWKS_URL` (Fly secrets)
5. Copy Issuer URL → `CLERK_ISSUER` (Fly secrets)

### Shipping data — EasyPost
1. Create account at [easypost.com](https://easypost.com)
2. Copy API Key → `EASYPOST_API_KEY` (Fly secrets)
3. Create a webhook endpoint pointing to `https://api.relay.app/webhooks/easypost`
4. Copy webhook secret → `EASYPOST_WEBHOOK_SECRET` (Fly secrets)

### Push notifications — Expo
1. Log in to [expo.dev](https://expo.dev)
2. Create an access token → `EXPO_ACCESS_TOKEN` (Fly secrets)

---

## Deploying the API — Fly.io

### First deploy (one-time setup)
```bash
# Authenticate with Fly
fly auth login

# Create the app (only needed once)
fly apps create relay-api --org personal

# Provision Fly Postgres (or use Neon connection string directly)
# fly postgres create --name relay-db

# Set all required secrets
fly secrets set \
  DATABASE_URL="postgresql://..." \
  CLERK_SECRET_KEY="sk_live_..." \
  CLERK_PUBLISHABLE_KEY="pk_live_..." \
  CLERK_JWKS_URL="https://clerk.yourdomain.com/.well-known/jwks.json" \
  CLERK_ISSUER="https://clerk.yourdomain.com" \
  EASYPOST_API_KEY="EZT..." \
  EASYPOST_WEBHOOK_SECRET="whsec_..." \
  EXPO_ACCESS_TOKEN="..." \
  SOCKET_IO_REDIS_URL="redis://..." \
  SENTRY_DSN="https://...@sentry.io/..." \
  CORS_ORIGIN="https://relay.app" \
  PUBLIC_BASE_URL="https://relay.app" \
  --app relay-api

# Run database migrations
fly ssh console --app relay-api -C "node apps/api/dist/scripts/migrate.js"

# Deploy
fly deploy --app relay-api --config apps/api/fly.toml
```

### Subsequent deploys
```bash
fly deploy --app relay-api --config apps/api/fly.toml
```

### Required env vars for API (production)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon or Fly Postgres) |
| `CLERK_SECRET_KEY` | Clerk backend secret |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_JWKS_URL` | Clerk JWKS endpoint URL |
| `CLERK_ISSUER` | Clerk issuer URL |
| `EASYPOST_API_KEY` | EasyPost API key |
| `EASYPOST_WEBHOOK_SECRET` | EasyPost webhook HMAC secret |
| `EXPO_ACCESS_TOKEN` | Expo push notification access token |
| `SOCKET_IO_REDIS_URL` | Redis URL for Socket.IO adapter |
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `CORS_ORIGIN` | Allowed CORS origin (web app URL) |
| `PUBLIC_BASE_URL` | Base URL for generated share links |
| `PORT` | HTTP port (default: 4000) |
| `NODE_ENV` | Set to `production` |

---

## Deploying the Web app — Vercel

### First deploy (one-time setup)
```bash
# Link project to Vercel
vercel link

# Set environment variables in Vercel dashboard or via CLI:
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_WS_URL production

# Deploy to production
vercel --prod
```

### Subsequent deploys
```bash
vercel --prod
```

Vercel also auto-deploys on push to `main` if the GitHub integration is enabled.

### Required env vars for Web (production)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk backend secret (server-side only) |
| `NEXT_PUBLIC_API_URL` | API base URL (e.g. `https://api.relay.app`) |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL (e.g. `wss://api.relay.app`) |
| `NEXT_PUBLIC_CLERK_MOCK_MODE` | Set to `false` in production |

---

## Deploying the Mobile app — EAS

> **Note:** Real builds require Apple Developer and Google Play Console accounts. This runbook documents the process; the autopilot does not invoke EAS builds automatically.

### First build setup
```bash
# Authenticate
eas login

# Configure project (one-time)
cd apps/mobile
eas build:configure

# Set secrets in EAS
eas secret:create --scope project --name CLERK_PUBLISHABLE_KEY --value "pk_live_..."
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.relay.app"
eas secret:create --scope project --name EXPO_PUBLIC_WS_URL --value "wss://api.relay.app"
```

### Build profiles

| Profile | Purpose |
|---|---|
| `development` | Local dev with Expo Go / dev client, iOS simulator supported |
| `preview` | Internal distribution for testers (no store submission) |
| `production` | Store builds with auto-increment version + auto-submit |

### Build commands
```bash
cd apps/mobile

# Development build (simulator)
eas build --profile development --platform ios

# Preview build (internal testers)
eas build --profile preview --platform all

# Production build + submit
eas build --profile production --platform all
eas submit --profile production --platform all
```

### Required env vars for Mobile (EAS secrets)
| Variable | Description |
|---|---|
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `EXPO_PUBLIC_API_URL` | API base URL |
| `EXPO_PUBLIC_WS_URL` | WebSocket URL |

---

## Mock mode (local development)

Set these flags to run the full app stack without any external accounts:

```bash
# API (.env or docker-compose env)
CLERK_MOCK_MODE=true
EASYPOST_MOCK_MODE=true

# Web (.env.local)
NEXT_PUBLIC_CLERK_MOCK_MODE=true

# Mobile (.env)
CLERK_MOCK_MODE=true
```

With mock mode enabled, the app runs with zero external keys using MSW handlers and a local JWT fixture.

---

## Health checks

- **API:** `GET https://api.relay.app/health` → `{"status":"ok"}`
- **Web:** `GET https://relay.app` → 200 OK

---

## Rollback

```bash
# API rollback to previous release
fly releases --app relay-api
fly deploy --app relay-api --image <previous-image>

# Web rollback via Vercel dashboard → Deployments → Promote previous
```
