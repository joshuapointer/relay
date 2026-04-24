# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Root commands use Turborepo; per-package commands use `pnpm --filter <name>`.

```bash
pnpm install            # install workspace deps (pnpm 9 + Node 20 required)
pnpm dev                # run all apps in parallel (api:4000, web:3000, mobile expo)
pnpm build              # turbo build; respects ^build dep chain
pnpm typecheck          # turbo typecheck
pnpm lint               # turbo lint
pnpm test               # turbo test (no cache)

# Per-app / per-package
pnpm --filter @relay/api dev                    # tsx watch src/server.ts
pnpm --filter @relay/api prisma:generate        # regen Prisma client after schema change
pnpm --filter @relay/api prisma:migrate         # prisma migrate dev
pnpm --filter @relay/api openapi:generate       # regen OpenAPI spec
pnpm --filter @relay/api exec tsx prisma/seed.ts   # seed carriers
pnpm --filter @relay/web dev                    # next dev -p 3000
pnpm --filter @relay/web test:e2e               # Playwright (requires dev server)
pnpm --filter @relay/mobile start               # expo start

# Single tests (Vitest)
pnpm --filter @relay/api exec vitest run src/__tests__/shipments.test.ts
pnpm --filter @relay/web exec vitest run path/to.test.tsx
# Mobile uses Jest (jest-expo), not Vitest:
pnpm --filter @relay/mobile exec jest path/to.test.tsx

# Local infra (Postgres 16 + Redis 7)
docker compose up postgres redis -d

# Helper scripts
pnpm launcher:gen       # regenerate mobile launcher icons from brand SVG
pnpm content:lint       # lint notification copy strings
```

## Architecture

Relay is a **Turborepo monorepo** for cross-platform shipment tracking: Expo mobile app + Next.js web + Fastify API share types, design tokens, and UI primitives via workspace packages.

### Workspace layout (`pnpm-workspace.yaml`: `apps/*`, `packages/*`, `tools/*`)

- **apps/api** (`@relay/api`) — Fastify 4 + Prisma 5 + Socket.IO 4, Postgres. Entry: `src/server.ts` → `src/app.ts` → routes under `/v1` prefix (health also mounted at root for load-balancer probes).
- **apps/web** (`@relay/web`) — Next.js 14 App Router. Route groups: `app/(auth)`, `app/(app)`, public `app/share/[token]`. Clerk + TanStack Query + Tailwind. Unit: Vitest; E2E: Playwright.
- **apps/mobile** (`@relay/mobile`) — Expo SDK 51 + Expo Router v3. Jest (`jest-expo`) — **not Vitest**. Route groups: `app/(auth)`, `app/(app)`.
- **packages/shared-types** (`@relay/shared-types`) — Zod schemas + inferred TS types. Sole source of wire-format contracts; subpath exports (`./status`, `./shipment`, `./notification`, `./share`). Consumed by api, web, mobile, sdk.
- **packages/sdk** (`@relay/sdk`) — typed REST client (`./rest`) + Socket.IO realtime client (`./realtime`). Consumed by web + mobile.
- **packages/ui-core** (`@relay/ui-core`) — cross-platform primitives with `./web` (DOM) and `./native` (RN) subpaths; `react-native` is an optional peer.
- **packages/design-tokens** (`@relay/design-tokens`) — Style Dictionary 4 pipeline. Exports `./web` (Tailwind theme) and `./native` (RN style objects).
- **packages/config-{eslint,tsconfig,vitest}** — shared build configs consumed via `workspace:*`.
- **tools/launcher-gen**, **tools/content-lint** — internal CLIs (not published).

### API data flow

1. **Auth:** `plugins/auth.ts` verifies Clerk JWTs via JWKS (`jose`). `CLERK_MOCK_MODE=true` swaps in a local fixture — used by tests + docker-compose. `auth/userService.ts` upserts a local `User` row keyed on `clerkId`.
2. **Shipments:** `routes/shipments.ts` → `services/shipments.ts` → Prisma. EasyPost data is fetched via `services/easypost/adapter.ts`; `services/easypost/statusMap.ts` maps provider statuses to the `InternalShipmentStatus` enum (single source of truth in `prisma/schema.prisma`).
3. **Webhooks:** `routes/webhooks/easypost.ts` verifies HMAC. `app.ts` installs a custom JSON parser that preserves `req.rawBody` — **required** for signature verification; don't remove it. Dedup via `WebhookEvent.{carrierId, providerEventId}` unique index.
4. **Realtime:** `realtime/io.ts` attaches Socket.IO to the Fastify server (decorates `app.io`). `realtime/broadcast.ts` emits per-user shipment updates after persistence. Socket.IO uses a Redis adapter in prod (`SOCKET_IO_REDIS_URL`).
5. **Push:** `services/push.ts` wraps `expo-server-sdk` for notifications to registered `PushToken`s.
6. **OpenAPI:** `@fastify/swagger` + `zod-to-json-schema` generate the spec from Zod schemas; served at `/docs`. Keep route schemas Zod-first.
7. **Errors:** global handler in `app.ts` maps `ZodError` → 400 `VALIDATION_ERROR`, Prisma P2002 → 409 `CONFLICT`, rate-limit → 429. All errors include `traceId: request.id`.

### Mock mode

`CLERK_MOCK_MODE=true` + `EASYPOST_MOCK_MODE=true` run the full stack with zero external credentials (MSW stubs for EasyPost, local JWT fixture for Clerk). Default in `.env.example` and docker-compose. **Never** set true in production.

### TypeScript config

`tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`. ESM throughout (`"type": "module"`); import paths from compiled packages use `.js` extensions (e.g. `from './db/client.js'`) even in `.ts` source.

### Turbo task graph

`build`, `lint`, `typecheck`, `test` all depend on `^build`, so package consumers get fresh `dist/`. `dev` is non-cached + persistent. Outputs: `dist/**`, `.next/**` (excl. `.next/cache/**`), `build/**`, `coverage/**`.

### Deployment targets

- **API** → Fly.io (`apps/api/fly.toml`, `apps/api/Dockerfile`)
- **Web** → Vercel (`apps/web/vercel.json`)
- **Mobile** → EAS (`apps/mobile/eas.json`) — not wired into autopilot
- **Postgres** → Neon; **Redis** → Upstash; **Auth** → Clerk; **Shipping data** → EasyPost; **Push** → Expo; **Errors** → Sentry.

Full runbook + required secrets per service: `infrastructure/README.md`.

## Conventions

- Wire-format types live **only** in `@relay/shared-types`. Don't duplicate Zod schemas in app code — import from there.
- New carriers: add a row to the `Carrier` table via seed, add status mapping in `services/easypost/statusMap.ts` (or a sibling module), and ensure webhook dedup uses `(carrierId, providerEventId)`.
- Changes to `prisma/schema.prisma` require `prisma:generate` + a new migration via `prisma:migrate`.
- When adding API routes, register in `src/routes/index.ts` under `registerApiRoutes` (they get the `/v1` prefix). Root-level probes go in `registerRoutes`.
- Raw JSON body is parsed into `req.rawBody` globally — use it for any signed-webhook verification.
