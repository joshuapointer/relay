# Relay — Autopilot Implementation Plan (Phase 1)

**Owner:** Phase 1 Planner
**Inputs:** `/home/joshpointer/relay/.omc/autopilot/requirements.md`, `/home/joshpointer/relay/.omc/autopilot/spec.md`
**Deliverable target:** Parallel executor handoff; 5 specialist workstreams; ship MVP-cut from §11 of spec in a single autopilot session.
**Repo root:** `/home/joshpointer/relay`

> Hard rule: every file path below is absolute under `/home/joshpointer/relay/`. Executors must not invent new top-level directories. If a task needs a new path it is authored here.

---

## Section 1 — Workstream decomposition

Five parallelizable workstreams aligned to the brief's five specialist roles. Each workstream has a sole owner per task ID; cross-workstream writes are forbidden outside the named handoff artifacts.

### WS-A — Backend / API
- **Scope:** `apps/api/**`, `packages/shared-types/**`, Prisma schema + migrations (including `ShareLink`), Fastify server (auth, REST, webhooks, public share-link route), Socket.IO `/rt` namespace, BullMQ workers, EasyPost adapter, Expo push sender, locked notification copy catalog.
- **Model tier:** `opus` for schema + auth plugin + webhook fan-out (load-bearing cross-cutting concerns); `sonnet` for per-route handlers and the EasyPost adapter; `haiku` for Zod schema wiring and small plugin glue.
- **Inputs it needs:** pnpm workspace from WS-E (root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`); `@relay/config-*` shared configs from WS-E; design-token package name reservation from WS-D only (no runtime dep — API does not import tokens).
- **Outputs other workstreams need:**
  - `packages/shared-types/src/index.ts` — Zod schemas + inferred TS types for `Shipment`, `TrackingEvent`, `Notification`, `User`, DTOs. **Must ship before WS-B-02 and WS-C-02.**
  - `packages/sdk/src/index.ts` — typed client (`@relay/sdk`) wrapping REST + Socket.IO. Must ship before WS-B-03 and WS-C-03.
  - Live API on `http://localhost:3001` with seeded Postgres before WS-B/WS-C can integration-test.
  - `apps/api/openapi.json` (generated via `fastify-swagger`) for SDK generation.
- **Concurrency rules:** WS-A owns all writes under `apps/api/` and `packages/shared-types/`. Nobody else may edit Prisma schema. WS-A must publish `@relay/shared-types@0.1.0` to the workspace (via pnpm `workspace:*`) at the end of Foundation phase or WS-B/WS-C block.

### WS-B — Web (Next.js)
- **Scope:** `apps/web/**` — Next.js 14 App Router, Clerk middleware, Tailwind configured with design-token preset, tracking list + detail pages, shipment add form, share-link viewer, notifications center, real-time Socket.IO client hook.
- **Model tier:** `opus` for the Clerk + SDK + Socket.IO bootstrap and the detail page RSC/CSR split; `sonnet` for list/add/detail page components and map integration; `haiku` for copy-only string updates and Tailwind class fixes.
- **Inputs:** `@relay/design-tokens` (Tailwind preset, CSS vars, fonts) from WS-D; `@relay/shared-types` and `@relay/sdk` from WS-A; `@relay/ui-core` primitives from WS-D; running API from WS-A for live dev.
- **Outputs:** A buildable, Clerk-authed Next.js app at `apps/web/` with 5 routes: `/` (landing), `/sign-in`, `/dashboard`, `/shipments/[id]`, `/notifications`, plus public `/share/[token]`.
- **Concurrency rules:** WS-B writes only under `apps/web/`. Any web-only component lives in `packages/ui-web/` and is authored by WS-B, but it may only *consume* primitives from `ui-core`, never redefine them.

### WS-C — Mobile (Expo RN)
- **Scope:** `apps/mobile/**` — Expo SDK 51, Expo Router v3, Clerk RN SDK, push-token registration, tracking list/detail screens, add-shipment modal, notifications screen, Socket.IO client, in-app update handler.
- **Model tier:** `opus` for the Expo Router + Clerk + SDK + push bootstrap and the detail screen real-time wire-up; `sonnet` for per-screen UI; `haiku` for theme wiring and font-loader glue.
- **Inputs:** `@relay/design-tokens` (RN TS export, font files) from WS-D; `@relay/shared-types` and `@relay/sdk` from WS-A; `@relay/ui-core` + `@relay/ui-mobile` primitives from WS-D; running API from WS-A for live dev.
- **Outputs:** A runnable Expo app (`pnpm --filter @relay/mobile exec expo start`) with 5 screens: `/(auth)/sign-in`, `/(app)/index` (list), `/(app)/add`, `/(app)/shipments/[id]`, `/(app)/notifications`, plus launcher icon/splash wired to brand assets.
- **Concurrency rules:** WS-C writes only under `apps/mobile/`. Any mobile-only component lives in `packages/ui-mobile/`, authored by WS-C. Do not edit EAS config after WS-E-06 locks deployment settings.

### WS-D — Design system / Brand
- **Scope:** `packages/design-tokens/**`, `packages/ui-core/**`, `packages/ui-web/**` scaffolding, `packages/ui-mobile/**` scaffolding, logo SVGs, app-icon SVGs, launcher icon generation script, font asset vendoring (Poppins + Inter WOFF2 for web and TTF for mobile), Style Dictionary build, brand acceptance tests, mockup stories.
- **Model tier:** `opus` for Style Dictionary config + the ten brand acceptance tests + the SVG logo/icon authoring (load-bearing brand-correctness); `sonnet` for `ui-core` primitives (Button, Card, Badge, StatusPill, Text); `haiku` for Tailwind preset re-exports and font `@fontsource` wiring.
- **Inputs:** pnpm workspace from WS-E; nothing else. WS-D is a producer, not a consumer. It must ship token artifacts before WS-B-02/WS-C-02.
- **Outputs:**
  - `packages/design-tokens/build/tokens.rn.ts` (RN-compatible TS).
  - `packages/design-tokens/build/tokens.css` (CSS custom properties).
  - `packages/design-tokens/build/tailwind.preset.cjs` (Tailwind preset).
  - `packages/design-tokens/build/tokens.d.ts` (type declarations).
  - `packages/design-tokens/assets/logo/relay-lockup.svg`, `relay-lockup-white.svg`, `relay-icon.svg`, `relay-icon-white.svg`, `relay-launcher.svg` (launcher tile with `#003B73` background + white icon + `#00C2CB` accents).
  - `packages/design-tokens/assets/fonts/` — Poppins (400/500/600/700) + Inter (400/500) TTF (mobile) and WOFF2 (web).
  - `packages/ui-core/src/{Button,Card,Badge,StatusPill,Text}.tsx` — cross-platform primitives consumed by WS-B and WS-C.
  - Ten brand acceptance tests (spec §7) under `packages/design-tokens/tests/brand.spec.ts`.
- **Concurrency rules:** WS-D owns the only edits under `packages/design-tokens/**` and `packages/ui-core/**`. WS-B/WS-C do not edit tokens. If a token is missing they file a request as a commit message `feat(tokens): request <name>` and WS-D adds it.

### WS-E — DevOps / Infra
- **Scope:** root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.gitignore`, `.gitattributes`, `.editorconfig`, shared configs (`packages/config-eslint`, `packages/config-typescript`, `packages/config-jest`), `.env.example` per app, Dockerfile for API, `fly.toml`, `vercel.json`, `eas.json`, GitHub Actions workflows, `tooling/scripts/*`.
- **Model tier:** `opus` for `turbo.json` + root tsconfig topology + CI workflow (load-bearing); `sonnet` for per-app env templates + Dockerfile + Fly/Vercel config; `haiku` for `.nvmrc`, `.gitignore`, `.editorconfig`, and lint/prettier config copies.
- **Inputs:** None. WS-E is the earliest foundation. Completes before anyone else can do much beyond scaffolding.
- **Outputs:**
  - Bootable pnpm workspace: `pnpm install` at root succeeds.
  - `pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm -r build` all runnable (even if only trivial placeholders pass initially).
  - `.github/workflows/ci.yml` — lint+typecheck+test+build on PR.
  - `apps/api/Dockerfile`, `apps/api/fly.toml`, `apps/web/vercel.json`, `apps/mobile/eas.json` (deployment configs authored, not executed in MVP).
  - `.env.example` files per app documenting every secret from spec §9.
- **Concurrency rules:** WS-E owns root-level files and `packages/config-*`. Once WS-E-01 lands, other workstreams must add workspace deps via `pnpm add -w` against their own package, never edit the root `package.json`.

---

## Section 2 — Dependency graph

```
                          ┌────────────────────────────────────┐
                          │  WS-E-01 monorepo bootstrap        │
                          └────────────────┬───────────────────┘
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           ▼                               ▼                               ▼
  ┌────────────────┐              ┌──────────────────┐            ┌────────────────┐
  │ WS-D-01 tokens │              │ WS-A-01 api      │            │ WS-E-02 envs + │
  │  scaffold +    │              │  scaffold +      │            │  Dockerfile +  │
  │  Style Dict    │              │  Prisma schema   │            │  fly/vercel/   │
  └───────┬────────┘              └────────┬─────────┘            │  eas configs   │
          │                                │                      └────────────────┘
          ▼                                ▼
  ┌────────────────┐              ┌──────────────────┐
  │ WS-D-02 ui-core│              │ WS-A-02          │
  │  primitives    │              │  shared-types    │
  │  (Phase 2)     │              │  + status-map    │
  └───────┬────────┘              └────────┬─────────┘
          │                                │
          │                                ▼
          │                       ┌──────────────────┐
          │                       │ WS-A-03 Fastify  │
          │                       │ bootstrap + Clerk│
          │                       │ + clerk.ts fix.  │
          │                       └────────┬─────────┘
          │                                │
          │           ┌────────────────────┴─────────────────────┐
          │           ▼                                          ▼
          │  ┌──────────────────┐                     ┌──────────────────┐
          │  │ WS-A-04a shipmts │                     │ WS-A-05a notif.  │
          │  │ CRUD + EasyPost  │                     │ copy catalog     │
          │  │ adapter + MSW    │                     │ (locked)         │
          │  └────────┬─────────┘                     └────────┬─────────┘
          │           │                                        │
          │  ┌────────┴──────────┐                             │
          │  ▼                   ▼                             │
          │ ┌──────────────┐  ┌──────────────┐                 │
          │ │ WS-A-04b     │  │ WS-A-04c     │                 │
          │ │ webhook+HMAC │  │ share link   │                 │
          │ └──────┬───────┘  └──────┬───────┘                 │
          │        │                 │                         │
          │        └──────┬──────────┘                         │
          │               ▼                                    │
          │      ┌────────────────────┐ ◀──────────────────────┘
          │      │ WS-A-05 Socket.IO  │
          │      │ + BullMQ + push    │
          │      └────────┬───────────┘
          │               ▼
          │      ┌────────────────────┐
          │      │ WS-A-06 @relay/sdk │
          │      └────────┬───────────┘
          │               │
          └────────┬──────┘
                   ▼
          ┌────────────────────────────────────────────┐
          │       WS-B / WS-C can now build UI         │
          └────────┬───────────────────────────────────┘
                   │
           ┌───────┴────────┐
           ▼                ▼
   ┌──────────────┐   ┌──────────────┐
   │ WS-B-01..08  │   │ WS-C-01..08  │
   └──────┬───────┘   └──────┬───────┘
          └─────────┬────────┘
                    ▼
          ┌──────────────────┐        (parallel release gate,
          │ WS-D-04 brand    │         reachable once WS-A-02 +
          │ acceptance tests │         WS-D-01 complete):
          └──────────────────┘           WS-E-04 CI workflow
```

### Critical path (longest dependency chain)
`WS-E-01 → WS-A-01 → WS-A-02 → WS-A-03 → WS-A-04a → WS-A-04b → WS-A-04c → WS-A-05 → WS-A-06 → WS-B-02 → WS-B-03 → WS-B-04`
(Monorepo → API scaffold → shared types + status-map → Fastify + mock Clerk fixture → shipments CRUD + EasyPost adapter → webhook + HMAC + idempotency → share-link feature → realtime + push + notification catalog consumer → SDK → web providers wired → web dashboard → web detail + share.)

**WS-E-04 (CI workflow) is a parallel release gate**, not a serial critical-path node. It becomes reachable as soon as WS-A-02 + WS-D-01 complete (enough to lint/typecheck/test most workspaces). It blocks the MVP release, but executors in Batch N+1 are not blocked waiting for CI to finish its first run.

### Synchronization points
- **Sync-1 (end of Foundation):** `pnpm install` at root succeeds; all workspaces listed; `pnpm -r typecheck` passes with placeholder code. **Blocks:** everything downstream.
- **Sync-2 (shared contract published):** `@relay/shared-types` exports all Zod schemas + inferred types; `@relay/design-tokens` exports RN + Tailwind + CSS builds. **Blocks:** WS-B-02+, WS-C-02+.
- **Sync-3 (API reachable):** `pnpm --filter @relay/api dev` serves REST + `/rt` namespace locally against a seeded Postgres (docker-compose or Neon branch). **Blocks:** WS-B real-time hooks, WS-C real-time hooks, WS-B-08/WS-C-08 integration smoke.
- **Sync-4 (SDK published):** `@relay/sdk` exports a typed client with auth injection + Socket.IO wrapper. **Blocks:** WS-B-03, WS-C-03 data hooks.
- **Sync-5 (brand assets landed):** logos, icons, fonts in `packages/design-tokens/assets/`. **Blocks:** WS-B-06 (web header), WS-C-06 (mobile header + launcher icon), WS-D-04 brand acceptance tests.
- **Sync-6 (CI green on main):** all of `pnpm -r typecheck lint test build` pass, brand tests pass. **Release gate for MVP.**

---

## Section 3 — Sequenced task list

Every task: `ID · Title · Workstream · Model · Preconditions · Files · DoD · Acceptance`.

Model tier legend: `haiku` = single-file edit or mechanical wiring; `sonnet` = standard feature; `opus` = architecture, cross-cutting, or load-bearing correctness.

### Section 3.0 — Shared test fixtures (offline-first)

All acceptance commands must run green without any external credentials. Every task that consumes Clerk, EasyPost, or webhook HMAC has two modes:

- **Mock mode (default):** runs with zero env vars set. Uses MSW + local signers shipped below.
- **Live mode (optional):** gated on non-empty `$EASYPOST_API_KEY` AND `$CLERK_SECRET_KEY`. Test harness silently skips when absent; executor never blocks on missing secrets.

Shipped fixtures (authored in the referenced task, consumed by later tasks):

- `apps/api/tests/fixtures/clerk.ts` — shipped by WS-A-03. Exports `signTestJwt({ clerkId, email, displayName? })` returning a JWKS-compatible RS256 JWT + `startMockJwks()` that hosts `/well-known/jwks.json` on an ephemeral port and patches Clerk's JWKS URL via env `CLERK_JWKS_URL_OVERRIDE`.
- `apps/api/tests/fixtures/easypost-msw.ts` — shipped by WS-A-04a. MSW handlers covering `POST https://api.easypost.com/v2/trackers`, `GET /v2/trackers/:id`, `POST /v2/trackers/:id/refresh`. Handlers deterministic; canned fixtures in `apps/api/tests/fixtures/easypost-payloads/`.
- `apps/api/tests/fixtures/webhook-hmac.ts` — shipped by WS-A-04b. Exports `signWebhookBody(body, secret?)` producing `X-Hmac-Signature` header exactly matching server's `hmac.ts` verification path. Default secret `test-secret-local` identical in server test config.
- `apps/api/tests/fixtures/expo-push-mock.ts` — shipped by WS-A-05. MSW handler for `https://exp.host/--/api/v2/push/send` returning deterministic ticket IDs.

Test config: `apps/api/vitest.config.ts` auto-loads `setup.ts` which starts the MSW server + mock JWKS before all tests and tears them down after. No acceptance command takes a "if creds set" conditional — mocks are always on; live mode swaps them transparently when creds exist.

### Phase 1 — Foundation

**WS-E-01 · Monorepo bootstrap · WS-E · opus**
- Preconditions: none (first task).
- Files:
  - `/home/joshpointer/relay/package.json`
  - `/home/joshpointer/relay/pnpm-workspace.yaml`
  - `/home/joshpointer/relay/turbo.json`
  - `/home/joshpointer/relay/.nvmrc` (contents: `20`)
  - `/home/joshpointer/relay/.gitignore`
  - `/home/joshpointer/relay/.editorconfig`
  - `/home/joshpointer/relay/.gitattributes`
  - `/home/joshpointer/relay/tsconfig.base.json`
  - `/home/joshpointer/relay/README.md`
  - `/home/joshpointer/relay/packages/config-eslint/{package.json,index.js}` (ESLint 9 **flat** config — `export default [...]`; no legacy `.eslintrc` anywhere)
  - `/home/joshpointer/relay/packages/config-typescript/{package.json,base.json,react.json,node.json}`
  - `/home/joshpointer/relay/packages/config-vitest/{package.json,base.ts}` (replaces prior `config-jest` at the workspace level; `config-jest` is retained only for the mobile workspace via `jest-expo` preset re-export if needed)
- Definition of done:
  - Root `package.json` declares `packageManager: pnpm@9.x`, `engines.node: ">=20.11.0 <21"`, scripts `dev`, `build`, `lint`, `test`, `typecheck` delegating to `turbo`.
  - `pnpm-workspace.yaml` includes `apps/*` and `packages/*`.
  - `turbo.json` defines pipelines `build`, `lint`, `test`, `typecheck`, `dev` (persistent) with correct dependsOn and outputs (`dist/**`, `.next/**`, `build/**`).
  - `tsconfig.base.json` has `strict: true`, `moduleResolution: bundler`, `target: ES2022`, path hints for workspace packages.
  - Three config packages exist: `@relay/config-eslint` (ESLint 9 flat-config array composing `@typescript-eslint`, `eslint-plugin-react`, `eslint-config-prettier`, custom `no-raw-hex` / `no-arbitrary-spacing` rules), `@relay/config-typescript` (tsconfig bases), `@relay/config-vitest` (shared Vitest preset for node + jsdom flavors). No `.eslintrc.*` or `jest.config.cjs` is authored at root.
- Acceptance: `cd /home/joshpointer/relay && pnpm install --frozen-lockfile=false && pnpm -r typecheck` returns exit 0.

**WS-E-02 · Per-app env templates + deployment configs · WS-E · sonnet**
- Preconditions: WS-E-01.
- Files:
  - `/home/joshpointer/relay/apps/api/.env.example`
  - `/home/joshpointer/relay/apps/web/.env.example`
  - `/home/joshpointer/relay/apps/mobile/.env.example`
  - `/home/joshpointer/relay/apps/api/Dockerfile`
  - `/home/joshpointer/relay/apps/api/fly.toml`
  - `/home/joshpointer/relay/apps/web/vercel.json`
  - `/home/joshpointer/relay/apps/mobile/eas.json`
  - `/home/joshpointer/relay/docker-compose.yml` (local Postgres 16 + Redis 7)
- Definition of done:
  - API env template documents `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `EASYPOST_API_KEY`, `EASYPOST_WEBHOOK_SECRET`, `SENTRY_DSN`, `EXPO_ACCESS_TOKEN`, `PORT=3001`.
  - Web env documents `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_SENTRY_DSN`.
  - Mobile env documents `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL`, `EXPO_PUBLIC_SENTRY_DSN`.
  - Dockerfile is Node 20-slim multi-stage, installs pnpm, prunes to `@relay/api` deploy-only; final image runs `node dist/server.js` on port `3001`.
  - `fly.toml` primary region `iad`, `shared-cpu-1x` 1 GB, internal port 3001, http_service with `force_https`, release cmd `pnpm prisma migrate deploy`.
  - `vercel.json` declares `framework: nextjs`, root directory `apps/web`, install command pnpm, build command `pnpm --filter @relay/web build`.
  - `eas.json` has `development`, `preview`, `production` profiles; production uses `cli.appVersionSource: "remote"`.
  - `docker-compose.yml` brings up `postgres:16` on 5432 with volume and `redis:7-alpine` on 6379.
- Acceptance: `docker compose -f /home/joshpointer/relay/docker-compose.yml up -d` exits 0; `docker compose ps` shows both services healthy. `docker build -f /home/joshpointer/relay/apps/api/Dockerfile /home/joshpointer/relay` builds (may skip in CI if daemon unavailable — capture result regardless).

**WS-D-01 · design-tokens package + Style Dictionary · WS-D · opus**
- Preconditions: WS-E-01.
- Files:
  - `/home/joshpointer/relay/packages/design-tokens/package.json`
  - `/home/joshpointer/relay/packages/design-tokens/style-dictionary.config.mjs`
  - `/home/joshpointer/relay/packages/design-tokens/tokens/{color.json,typography.json,spacing.json,radius.json,shadow.json,motion.json}` (verbatim from spec §6)
  - `/home/joshpointer/relay/packages/design-tokens/build/.gitkeep`
  - `/home/joshpointer/relay/packages/design-tokens/src/index.ts` (re-exports built artifacts)
  - `/home/joshpointer/relay/packages/design-tokens/tsconfig.json`
- Definition of done:
  - Running `pnpm --filter @relay/design-tokens build` emits `build/tokens.rn.ts`, `build/tokens.css`, `build/tailwind.preset.cjs`, `build/tokens.d.ts`.
  - Generated TS exports a `tokens` const exactly matching spec §6 shape; `tokens.color.brand.deepTechBlue === '#003B73'`, `tokens.color.brand.agileTeal === '#00C2CB'`, `tokens.color.state.alert === '#FFB800'`, `tokens.color.state.success === '#2ECC71'`, `tokens.color.neutral.cloudGray === '#F4F6F9'`, `tokens.color.neutral.inkBlack === '#1A1A1A'`.
  - `src/index.ts` re-exports `tokens` (from `build/tokens.rn`) as the default consumer entry; sub-path exports added for `@relay/design-tokens/tailwind` and `@relay/design-tokens/css`.
  - Tailwind preset exports `brand-blue`, `brand-teal`, `state-alert`, `state-success`, `cloud-gray`, `ink-black`, `surface-base`, `surface-muted`, plus spacing/typography per spec §6.
- Acceptance: `pnpm --filter @relay/design-tokens build && node -e "const t=require('/home/joshpointer/relay/packages/design-tokens/build/tokens.rn').tokens; if(t.color.brand.deepTechBlue!=='#003B73')process.exit(1)"` returns 0.

**WS-A-01 · API scaffold + Prisma schema · WS-A · opus**
- Preconditions: WS-E-01.
- Files:
  - `/home/joshpointer/relay/apps/api/package.json`
  - `/home/joshpointer/relay/apps/api/tsconfig.json` (extends `@relay/config-typescript/node.json`)
  - `/home/joshpointer/relay/apps/api/src/server.ts` (placeholder Fastify listening on `PORT`)
  - `/home/joshpointer/relay/apps/api/prisma/schema.prisma` (verbatim from spec §3; extended in WS-A-04c to add the `ShareLink` model via migration, not in this task)
  - `/home/joshpointer/relay/apps/api/prisma/seed.ts` (seed `Carrier` rows: usps/ups/fedex/dhl)
  - `/home/joshpointer/relay/apps/api/eslint.config.js` (ESLint 9 flat config), `vitest.config.ts`
- Definition of done:
  - `package.json` declares deps `fastify@^4`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/helmet`, `@clerk/fastify`, `@prisma/client`, `prisma`, `zod`, `pino`, `pino-pretty`, `socket.io`, `@socket.io/redis-adapter`, `ioredis`, `bullmq`, `@easypost/api`, `expo-server-sdk`, `@sentry/node`.
  - `pnpm --filter @relay/api prisma:generate` emits Prisma client.
  - `pnpm --filter @relay/api prisma:migrate:dev --name init` creates migration under `apps/api/prisma/migrations/` with all tables and enums from spec §3.
  - `pnpm --filter @relay/api dev` starts Fastify on `PORT=3001`; `GET /health` returns `{"status":"ok"}`.
- Acceptance: `curl -s http://localhost:3001/health` prints `{"status":"ok"}` after `pnpm --filter @relay/api dev &`.

### Phase 2 — Core slice (end-to-end one-carrier path)

**WS-D-02 · ui-core primitives · WS-D · sonnet**  *(moved into Phase 2 — unblocks WS-B-02 and WS-C-02)*
- Preconditions: WS-D-01.
- Files:
  - `/home/joshpointer/relay/packages/ui-core/package.json`
  - `/home/joshpointer/relay/packages/ui-core/src/{index.ts,Button.tsx,Card.tsx,Badge.tsx,StatusPill.tsx,Text.tsx,theme.ts,platform.ts}`
- Definition of done:
  - Components consume `@relay/design-tokens`; no raw hex strings in source.
  - `StatusPill` maps `DisplayShipmentStatus` → token color + icon + text label (never color alone, AC-9). Mapping: `Pending`→deepTechBlue, `In Transit`→amber, `Out for Delivery`→amber, `Delivered`→successGreen, `Exception`→amber+icon.
  - Works under both `react-native` and `react-native-web` (so Next.js can consume directly via `transpilePackages`).
  - ESLint rule `no-raw-hex` in `@relay/config-eslint` flags any `#[0-9a-fA-F]{3,8}` outside `packages/design-tokens/tokens/`.
- Acceptance: `pnpm --filter @relay/ui-core typecheck` green; `pnpm --filter @relay/ui-core test` (Vitest) renders each primitive with a token-backed snapshot.

**WS-A-02 · shared-types Zod schemas · WS-A · sonnet**
- Preconditions: WS-A-01.
- Files:
  - `/home/joshpointer/relay/packages/shared-types/package.json`
  - `/home/joshpointer/relay/packages/shared-types/src/index.ts`
  - `/home/joshpointer/relay/packages/shared-types/src/{shipment,event,notification,user,carrier,common}.ts`
  - `/home/joshpointer/relay/packages/shared-types/tsconfig.json`
- Definition of done:
  - Exports Zod schemas + inferred types. Status enum is split per spec §3 / requirements AC-8 divergence:
    - `InternalShipmentStatusSchema` — 7 members `PENDING|IN_TRANSIT|OUT_FOR_DELIVERY|DELIVERED|EXCEPTION|RETURNED|UNKNOWN`. Used by Prisma persistence layer + carrier adapter mapping.
    - `DisplayShipmentStatusSchema` — 5 members `Pending|In Transit|Out for Delivery|Delivered|Exception`. Used on every REST response body, Socket.IO payload, and UI surface.
  - Also exports `ShipmentSchema`, `TrackingEventSchema`, `NotificationSchema`, `UserSchema`, `CarrierSchema`. `ShipmentSchema` serializes `status` as `DisplayShipmentStatus`; a sibling `ShipmentInternalSchema` (persistence-only) serializes `status` as `InternalShipmentStatus`.
  - Ships `apps/api/src/mappers/status-map.ts` exporting `toDisplay(internal: InternalShipmentStatus): DisplayShipmentStatus` with mapping: `RETURNED → "Exception"`, `UNKNOWN → "Exception"`, others → identity (title-cased). All REST serializers call `toDisplay` before emitting responses.
  - Exports DTO schemas for every REST endpoint in spec §4 (`CreateShipmentRequest`, `UpdateShipmentRequest`, `ShipmentListResponse` with cursor pagination, etc.).
  - Exports Socket.IO event payload schemas (`ShipmentUpdatedPayload`, `TrackingEventPayload`, `NotificationCreatedPayload`).
  - No runtime Prisma import; types align with Prisma shapes manually.
- Acceptance:
  - `pnpm --filter @relay/shared-types typecheck` passes.
  - Vitest unit on `apps/api/src/mappers/status-map.ts` covers all 7 input values → expected 5-member outputs (7 assertions, zero uncovered branches).
  - Importing `InternalShipmentStatusSchema.parse('DELIVERED')` returns `'DELIVERED'`; `DisplayShipmentStatusSchema.parse('Delivered')` returns `'Delivered'`; `DisplayShipmentStatusSchema.parse('RETURNED')` throws.

**WS-A-03 · Fastify bootstrap + auth + error shape · WS-A · opus**
- Preconditions: WS-A-02.
- Files:
  - `/home/joshpointer/relay/apps/api/src/server.ts` (replace placeholder)
  - `/home/joshpointer/relay/apps/api/src/plugins/{auth.ts,errors.ts,zod.ts,cors.ts,rate-limit.ts,sentry.ts,logger.ts}`
  - `/home/joshpointer/relay/apps/api/src/modules/users/routes.ts` (`GET /v1/me`, `PATCH /v1/me`)
  - `/home/joshpointer/relay/apps/api/tests/fixtures/clerk.ts` (local JWT signer + mock JWKS server — see Section 3.0)
  - `/home/joshpointer/relay/apps/api/tests/setup.ts` (starts MSW + mock JWKS pre-test, teardown post-test)
- Definition of done:
  - `auth.ts` registers `@clerk/fastify`; rejects requests without a valid JWT with `{error:{code:'UNAUTHENTICATED',...}}` 401; on success upserts User row by `clerkId`. Auth plugin honors `CLERK_JWKS_URL_OVERRIDE` env (used by mock mode) so tests run without live Clerk.
  - `errors.ts` installs a setErrorHandler emitting the documented shape `{ error: { code, message, traceId } }` with `traceId` = `request.id`.
  - `zod.ts` registers a validator compiler translating Zod schemas to Fastify's validation pipeline; Zod errors produce `code:'VALIDATION_ERROR'` 400.
  - `cors.ts` permits `https://relay.app`, `https://*.relay.app`, any `*.vercel.app`, and `http://localhost:3000`, `exp://*` in dev.
  - `rate-limit.ts` installs `@fastify/rate-limit` with 100 rpm default, stricter overrides declared via route options.
  - `GET /v1/me` returns `{ id, clerkId, email, displayName }`; `PATCH /v1/me` accepts `{ displayName?: string }`.
  - `tests/fixtures/clerk.ts` exports `signTestJwt()` + `startMockJwks()` as described in Section 3.0. Must be consumable by WS-A-04a/04b/04c/05/07 with zero live Clerk env.
- Acceptance (mock mode, default, runs with ZERO env vars):
  - `pnpm --filter @relay/api test -- -t "auth"` green. Integration test uses `signTestJwt()` + mock JWKS; unauth request → 401 with error shape; authed request → user row.
- Acceptance (live mode, optional, silently skipped when creds absent):
  - If `$CLERK_SECRET_KEY` non-empty: additional test suite `-t "auth-live"` validates against real Clerk JWKS.

**WS-A-04a · Shipments CRUD + EasyPost adapter · WS-A · opus**
- Preconditions: WS-A-03.
- Files:
  - `/home/joshpointer/relay/apps/api/src/modules/shipments/{routes.ts,service.ts,repository.ts}`
  - `/home/joshpointer/relay/apps/api/src/modules/carriers/{routes.ts,seed.ts}`
  - `/home/joshpointer/relay/apps/api/src/integrations/easypost/{client.ts,adapter.ts}`
  - `/home/joshpointer/relay/apps/api/src/integrations/carrier.ts` (interface)
  - `/home/joshpointer/relay/apps/api/tests/fixtures/easypost-msw.ts` (MSW handlers — see Section 3.0)
  - `/home/joshpointer/relay/apps/api/tests/fixtures/easypost-payloads/*.json`
- Definition of done:
  - Implements every REST route from spec §4 that is CRUD-shaped (`GET/POST/PATCH/DELETE /v1/shipments`, `GET /v1/shipments/:id`, `POST /v1/shipments/:id/refresh`, `GET /v1/shipments/:id/events`). Socket.IO / push-token / notification / share routes land in later tasks.
  - `CarrierAdapter` interface in `src/integrations/carrier.ts`; EasyPost adapter implements `createTracker`, `refreshTracker`, `mapStatus`. Adapter imports `toDisplay` from the mapper shipped by WS-A-02.
  - Aggregator outage path: circuit-breaker in `adapter.ts` flips after 5 consecutive 5xx or timeouts; routes return cached state and set `X-Relay-Live-Paused: true` (spec §2.4 #27).
  - All bodies validated via `@relay/shared-types` Zod schemas.
- Acceptance (mock mode, default, zero creds):
  - `pnpm --filter @relay/api test -- -t "shipments"` passes ≥ 6 integration tests using `easypost-msw.ts`. `POST /v1/shipments { trackingNumber: "EZ1000000001" }` → 201 with persisted row; response status is a 5-member `DisplayShipmentStatus`.
- Acceptance (live mode, optional):
  - If `$EASYPOST_API_KEY` non-empty: `-t "shipments-live"` suite runs identical flow against real EasyPost sandbox.

**WS-A-04b · EasyPost webhook + HMAC + idempotency + circuit breaker · WS-A · opus**
- Preconditions: WS-A-04a.
- Files:
  - `/home/joshpointer/relay/apps/api/src/modules/webhooks/easypost.ts`
  - `/home/joshpointer/relay/apps/api/src/integrations/easypost/{hmac.ts,status-map.ts}`
  - `/home/joshpointer/relay/apps/api/tests/fixtures/webhook-hmac.ts` (see Section 3.0)
- Definition of done:
  - Webhook handler verifies HMAC via `EASYPOST_WEBHOOK_SECRET` using `crypto.timingSafeEqual`; persists to `WebhookEvent` with `externalId` unique for idempotency; updates `Shipment` and appends `TrackingEvent` within a single Prisma transaction.
  - `status-map.ts` maps every EasyPost status to the 7-member `InternalShipmentStatus` enum; unknown codes map to `UNKNOWN` and emit a structured log warn (spec §2.4 #25, AC-8). Before emitting over REST the caller passes through `toDisplay` (WS-A-02 mapper).
  - Circuit breaker (introduced in WS-A-04a) coordinates with webhook replay: if breaker open, the webhook path still writes state but flips `X-Relay-Live-Paused: true` on subsequent reads.
- Acceptance (mock mode, default):
  - `pnpm --filter @relay/api test -- -t "webhook"` passes ≥ 5 tests: valid HMAC→200 and persisted; invalid HMAC→401; replay of same `externalId`→one `TrackingEvent` row (idempotency); breaker-open path returns cached state + header; unknown status→UNKNOWN internal + "Exception" displayed.
  - Webhook signatures produced entirely by `webhook-hmac.ts`; no real EasyPost traffic required.
- Acceptance (live mode, optional): if `$EASYPOST_WEBHOOK_SECRET` non-empty, add a "live-hmac" test using the real secret instead of the test default.

**WS-A-04c · Share link feature (ShareLink model + public route + rate limit) · WS-A · opus**
- Preconditions: WS-A-04a.
- Files:
  - `/home/joshpointer/relay/apps/api/prisma/schema.prisma` (extend — new `ShareLink` model)
  - `/home/joshpointer/relay/apps/api/prisma/migrations/<timestamp>_share_link/migration.sql`
  - `/home/joshpointer/relay/apps/api/src/modules/share/{routes.ts,service.ts,token.ts}`
  - `/home/joshpointer/relay/packages/shared-types/src/share.ts` (Zod DTOs `CreateShareLinkResponse`, `PublicShipmentView`)
- Definition of done:
  - Prisma model: `ShareLink { id String @id, token String @unique @db.VarChar(32), shipmentId String, expiresAt DateTime, createdAt DateTime @default(now()), @@index([shipmentId]) }`. Token is a 32-char url-safe random (node `crypto.randomBytes(24).toString('base64url')`).
  - `POST /v1/shipments/:id/share` — auth required; body `{ ttlDays?: number (1..30, default 7) }`; returns `{ token, url, expiresAt }`. Rate-limited to 60 requests/hour per authenticated user (override on `@fastify/rate-limit` per-route options).
  - `GET /v1/share/:token` — **public** (no auth); returns a `PublicShipmentView`: status (DisplayShipmentStatus), carrier, lastEvent (location + timestamp), eta, timeline. No `trackingNumber`, no origin/destination PII, no userId, no nickname.
  - Expired tokens return 410 Gone. Unknown tokens return 404 Not Found. Rate-limit breach returns 429.
  - Default share TTL is 7 days; hard max 30 days. Confirms with Section 7 "Share link TTL" default (updated below to 7d default, 30d max).
- Acceptance (mock mode, default):
  - `pnpm --filter @relay/api test -- -t "share"` passes ≥ 5 tests: happy-path create+fetch, expired-token→410, invalid-token→404, unauthed POST→401, rate-limit breach at 61st POST→429.
  - Integration test asserts PII fields are absent from `GET /v1/share/:token` response.

**WS-A-05 · Socket.IO `/rt` + BullMQ fanout + push sender · WS-A · opus**
- Preconditions: WS-A-04b, WS-A-05a.
- Files:
  - `/home/joshpointer/relay/apps/api/src/plugins/socket.ts`
  - `/home/joshpointer/relay/apps/api/src/jobs/{queue.ts,fanout.ts,push.ts}`
  - `/home/joshpointer/relay/apps/api/src/modules/notifications/{routes.ts,service.ts}`
  - `/home/joshpointer/relay/apps/api/src/modules/push-tokens/routes.ts`
  - `/home/joshpointer/relay/apps/api/tests/fixtures/expo-push-mock.ts` (see Section 3.0)
- Definition of done:
  - Socket.IO attached under namespace `/rt`; handshake verifies `auth.token` via the same Clerk plugin used in WS-A-03 (mock mode consumable for tests via `tests/fixtures/clerk.ts`); on success socket joins `user:<userId>`.
  - Client events `shipment:subscribe` / `shipment:unsubscribe` join/leave `shipment:<id>` rooms, gated by ownership check.
  - BullMQ queue `fanout` created on Redis; webhook handler enqueues a job after commit; worker broadcasts `shipment:updated` + `tracking:event` and inserts a `Notification` row + queues a push job.
  - `push.ts` uses `expo-server-sdk` to send Expo push messages in batches with retry-on-DeviceNotRegistered (prunes stale `PushToken`). HTTP client routed through MSW in mock mode.
  - `/v1/push-tokens` register/unregister routes persist `expoToken` unique per user/platform.
  - `/v1/notifications`, `/v1/notifications/:id/read`, `/v1/notifications/read-all` implemented per spec §4.
  - De-duplication: skip notification dispatch when another with same `(userId, shipmentId, kind)` was `sentAt` within 60s (spec §2.5 #33).
  - Notification copy: all outbound title/body strings are **imported** from `apps/api/src/content/notifications.ts` (authored in WS-A-05a). No inline string authoring in this task — any new copy request must update the catalog.
  - Proactive delay path: when `estimatedDelivery` slips > 24h a `DELAY` notification is enqueued using the catalog entry for the relevant transition.
- Acceptance (mock mode, default, zero creds):
  - `pnpm --filter @relay/api test -- -t "realtime"` integration test: fake webhook (via `webhook-hmac.ts`) → within 2s, a connected Socket.IO client on `/rt` subscribed to `shipment:<id>` receives `shipment:updated` and `tracking:event` events and a matching `Notification` row exists. Socket handshake uses JWT from `clerk.ts` fixture.
  - `pnpm --filter @relay/api test -- -t "push"`: `expo-push-mock.ts` receives a correctly shaped payload (title/body/data.shipmentId) per spec §2.5 #31 samples.
- Acceptance (live mode, optional): if `$EXPO_ACCESS_TOKEN` non-empty, add `-t "push-live"` that routes to real Expo push and asserts a 200 ticket response.

**WS-A-05a · Locked notification copy catalog · WS-A · haiku**
- Preconditions: WS-A-02.
- Files:
  - `/home/joshpointer/relay/apps/api/src/content/notifications.ts`
  - `/home/joshpointer/relay/apps/api/src/content/notifications.test.ts`
- Definition of done:
  - Exports a `const NOTIFICATIONS` map, `as const`-asserted, keyed by transition pairs using `DisplayShipmentStatus` (5 members). Minimum 15 meaningful transitions covered (5×5 transition matrix minus identity pairs minus impossible reversals = ~15). For each entry, values are `{ title: string, body: string, kind: 'STATUS' | 'DELAY' | 'DELIVERED' | 'EXCEPTION' }`.
  - Also exports a static `ALL_TRANSITIONS` const array listing the exact 15 `(fromStatus, toStatus, kind)` tuples the catalog promises to cover. Type-level exhaustiveness check via a `satisfies Record<TransitionKey, NotificationCopy>` assertion.
  - Tone compliance: clarity over cleverness, proactive, professional. Example tone: `"Your package is arriving today"` / `"Live updates paused — we're still showing your latest info"`. Forbidden-word list (kept in sync with Phase-5 content-lint): `"just"`, `"maybe"`, `"simply"`, `"sorry"`, `"unfortunately"`. No exclamation marks in any copy. Each body ≤ 120 chars; each title ≤ 60 chars.
  - Content-lint script (`tooling/scripts/content-lint.mjs`, authored in WS-E-03) extends its forbidden-word list to include this list and scans this file.
- Acceptance (mock mode, default):
  - `pnpm --filter @relay/api test -- -t "notifications.catalog"` passes:
    - For every `(from, to, kind)` in `ALL_TRANSITIONS`: catalog entry exists, `title.length` between 1 and 60, `body.length` between 1 and 120.
    - No forbidden word appears in any title or body (case-insensitive).
    - No `!` appears anywhere.
  - `pnpm --filter @relay/api test -- -t "notifications.catalog"` fails if any catalog entry is deleted (regression guard).

**WS-A-06 · @relay/sdk typed client · WS-A · sonnet**
- Preconditions: WS-A-05.
- Files:
  - `/home/joshpointer/relay/packages/sdk/package.json`
  - `/home/joshpointer/relay/packages/sdk/src/{index.ts,rest.ts,socket.ts,errors.ts,types.ts}`
  - `/home/joshpointer/relay/packages/sdk/tsconfig.json`
- Definition of done:
  - Exports `createRelayClient({ baseUrl, getToken, socketUrl })` returning `{ rest, socket }`.
  - `rest` has one method per REST endpoint, validates response with the Zod schema from `@relay/shared-types`, injects `Authorization: Bearer <token>` via `getToken()`.
  - `socket` wraps Socket.IO client on `/rt`, exposes `subscribe(shipmentId)`, `unsubscribe(shipmentId)`, and typed event emitters (`onShipmentUpdated`, `onTrackingEvent`, `onNotification`).
  - Transport errors wrapped into `RelayApiError` with `code`, `message`, `httpStatus`, `traceId`.
- Acceptance: `pnpm --filter @relay/sdk typecheck` passes; `pnpm --filter @relay/sdk test -- -t "rest"` (Vitest) runs an in-process API (MSW + fixtures from Section 3.0) and asserts the SDK round-trips a shipment list + a socket subscribe event. No live creds required.

**WS-B-01 · Web app scaffold + Clerk middleware + Tailwind tokens · WS-B · opus**
- Preconditions: WS-E-01, WS-D-01.
- Files:
  - `/home/joshpointer/relay/apps/web/package.json`
  - `/home/joshpointer/relay/apps/web/next.config.mjs` (transpile `@relay/*`)
  - `/home/joshpointer/relay/apps/web/tailwind.config.ts` (uses `require('@relay/design-tokens/tailwind')` preset)
  - `/home/joshpointer/relay/apps/web/postcss.config.cjs`
  - `/home/joshpointer/relay/apps/web/app/{layout.tsx,globals.css,page.tsx}`
  - `/home/joshpointer/relay/apps/web/middleware.ts` (`clerkMiddleware()` protecting `/dashboard`, `/shipments/(.*)`, `/notifications`)
  - `/home/joshpointer/relay/apps/web/app/(auth)/sign-in/[[...rest]]/page.tsx`
  - `/home/joshpointer/relay/apps/web/tsconfig.json`
- Definition of done:
  - Next.js 14 App Router; React 18; `next/font/google` loads Poppins + Inter (fallback system-ui); CLS stays below 0.1.
  - Tailwind config merges `@relay/design-tokens/tailwind` preset; `globals.css` imports `@relay/design-tokens/css` for CSS vars.
  - Root `layout.tsx` wraps children in `<ClerkProvider>`.
  - `/` is a minimal marketing landing with wordmark in `deepTechBlue` header, "Sign in" CTA; passes WCAG contrast.
  - `pnpm --filter @relay/web build` succeeds.
- Acceptance: `pnpm --filter @relay/web dev` serves `http://localhost:3000` and the landing renders the wordmark in `#003B73` (asserted via Playwright computed-style check in WS-D-04).

**WS-B-02 · ui-core primitives consumption + SDK client provider · WS-B · sonnet**
- Preconditions: WS-B-01, WS-D-02, WS-A-06.
- Files:
  - `/home/joshpointer/relay/apps/web/lib/{api.ts,socket.ts,queryClient.ts}`
  - `/home/joshpointer/relay/apps/web/components/providers/{ReactQueryProvider.tsx,SocketProvider.tsx}`
  - `/home/joshpointer/relay/apps/web/app/layout.tsx` (wrap providers)
- Definition of done:
  - `api.ts` instantiates `@relay/sdk` with `getToken` reading Clerk session token from `auth()`.
  - `SocketProvider` connects on mount, disconnects on unmount, re-authenticates on token refresh.
  - TanStack Query v5 with 30s stale time for list, 5s for detail.
- Acceptance: placeholder server component calling `sdk.rest.listShipments()` renders server-side without throwing (mock API permissible in unit test).

**WS-B-03 · Dashboard list page · WS-B · sonnet**
- Preconditions: WS-B-02.
- Files:
  - `/home/joshpointer/relay/apps/web/app/dashboard/page.tsx` (RSC)
  - `/home/joshpointer/relay/apps/web/app/dashboard/_components/{ShipmentList.tsx,ShipmentRow.tsx,FilterTabs.tsx,EmptyState.tsx,AddShipmentDialog.tsx}`
- Definition of done:
  - Filter tabs `All | In Transit | Out for Delivery | Delivered | Exception` per spec 2.2 #12.
  - Each row uses `ui-core` `StatusPill` with correct token color (pending=deepTechBlue, inTransit=amber, outForDelivery=amber, delivered=successGreen, exception=amber+icon).
  - Row title = nickname || trackingNumber; subtitle = carrier displayName + last event location in `agileTeal`.
  - `AddShipmentDialog` posts to `sdk.rest.createShipment`; on success invalidates list query.
  - Manual refresh button top-right (spec §2.2 #15).
- Acceptance: Playwright test `apps/web/tests/dashboard.spec.ts` mocks SDK, renders 3 shipments across 3 statuses, clicks the "Delivered" filter tab, asserts only green pills visible.

**WS-B-04 · Shipment detail page + map + timeline · WS-B · opus**
- Preconditions: WS-B-03.
- Files:
  - `/home/joshpointer/relay/apps/web/app/shipments/[id]/page.tsx`
  - `/home/joshpointer/relay/apps/web/app/shipments/[id]/_components/{InfoPanel.tsx,TrackingMap.tsx,EventTimeline.tsx,ShareButton.tsx,LivePausedBanner.tsx}`
  - `/home/joshpointer/relay/apps/web/app/share/[token]/page.tsx`
- Definition of done:
  - Two-column layout: `<InfoPanel className="w-full lg:w-2/5">` + `<TrackingMap className="w-full lg:w-3/5">` (BR-31).
  - Map placeholder: `<div>` with `agileTeal` route line SVG overlay and origin/destination/current pins — full Mapbox integration is v1.1; placeholder must still render teal route (BR-35).
  - Live updates: subscribes via `SocketProvider` to `shipment:<id>`; `onTrackingEvent` prepends timeline, `onShipmentUpdated` updates status pill.
  - Cache fallback banner when API sends `X-Relay-Live-Paused: true` or socket drops for >5s (spec §2.4 #27).
  - Share button calls `POST /v1/shipments/:id/share` (route shipped by WS-A-04c) and copies the returned URL to clipboard; `/share/[token]` renders read-only `PublicShipmentView` with status + timeline, no PII (AC-10). Expired tokens render a friendly 410 page; invalid tokens render 404.
  - InfoPanel card titles in `font-heading font-semibold` (Poppins Semi-Bold, BR-33), body in `font-body font-normal` (Inter Regular, BR-34). Cards use `bg-surface-muted` (`cloudGray`, BR-32).
- Acceptance: Playwright visits `/shipments/test-id` with mocked SDK, asserts teal route color `#00C2CB` in rendered SVG path, timeline shows 3 seed events newest-first.

**WS-B-05 · Notifications center · WS-B · sonnet**
- Preconditions: WS-B-04.
- Files:
  - `/home/joshpointer/relay/apps/web/app/notifications/page.tsx`
  - `/home/joshpointer/relay/apps/web/app/notifications/_components/{NotificationList.tsx,NotificationRow.tsx}`
- Definition of done:
  - Lists last 30 notifications (spec §6 matrix); infinite scroll via cursor.
  - Unread rows have an `amber` dot; click marks read via `sdk.rest.markNotificationRead`.
  - Deep-link: clicking a shipment notification routes to `/shipments/:id`.
  - Real-time: `onNotification` prepends to list.
- Acceptance: Playwright test asserts unread→read toggle and deep-link navigation.

**WS-B-06 · Header lockup + top nav with brand · WS-B · sonnet**
- Preconditions: WS-B-01, WS-D-03a.
- Files:
  - `/home/joshpointer/relay/apps/web/components/chrome/{TopNav.tsx,UserMenu.tsx}`
- Definition of done:
  - Top nav bg `bg-brand-blue`; wordmark white SVG on left; UserMenu avatar right; nav links `Dashboard`, `Notifications`.
  - Full lockup (icon + wordmark) on dashboard page header top-left (BR-24 analog for web).
  - Poppins Bold headers, Inter for body (BR-4/BR-5).
- Acceptance: Playwright computed style: `TopNav` background `#003B73`, wordmark fill `#FFFFFF`.

**WS-B-07 · Empty / loading / error states + a11y + tone · WS-B · sonnet**
- Preconditions: WS-B-05, WS-B-06.
- Files:
  - `/home/joshpointer/relay/apps/web/app/dashboard/loading.tsx`, `error.tsx`, `not-found.tsx`
  - `/home/joshpointer/relay/apps/web/app/shipments/[id]/loading.tsx`, `error.tsx`, `not-found.tsx`
  - `/home/joshpointer/relay/apps/web/components/states/{EmptyShipments.tsx,ErrorBoundary.tsx}`
  - `/home/joshpointer/relay/apps/web/content/strings.ts` (locked copy per tone guide)
- Definition of done:
  - All copy routed through `strings.ts`; no inline English strings in components for user-facing UI.
  - Empty state: "Nothing to track yet. Paste a tracking number to get started." — no emoji, no pun.
  - Error state: "Live updates paused. We're still showing your latest info." — reassuring per BR-37/BR-38.
  - Every icon-only button has `aria-label`; focus ring visible; status pills include label text + icon, never color alone (AC-9).
- Acceptance: `@axe-core/playwright` audit returns 0 serious/critical violations across the 5 web routes.

**WS-B-08 · Web tests + coverage for auth / detail / share · WS-B · sonnet**
- Preconditions: WS-B-07.
- Files:
  - `/home/joshpointer/relay/apps/web/tests/{dashboard.spec.ts,detail.spec.ts,share.spec.ts,a11y.spec.ts,brand.spec.ts}`
  - `/home/joshpointer/relay/apps/web/vitest.config.ts` (unit tests), `playwright.config.ts` (e2e, local-only in MVP CI)
- Definition of done:
  - Vitest unit tests for components rendering token-backed styles.
  - Brand spec: imports `@relay/design-tokens` and asserts Tailwind classes render expected hex values (via `getComputedStyle`).
  - Playwright config has `webServer` auto-starting `pnpm --filter @relay/web dev`.
- Acceptance: `pnpm --filter @relay/web test` runs unit tests green.

**WS-C-01 · Expo app scaffold + Clerk + Expo Router · WS-C · opus**
- Preconditions: WS-E-01, WS-D-01.
- Files:
  - `/home/joshpointer/relay/apps/mobile/package.json`
  - `/home/joshpointer/relay/apps/mobile/app.config.ts`
  - `/home/joshpointer/relay/apps/mobile/metro.config.js` (symlinked workspace support)
  - `/home/joshpointer/relay/apps/mobile/babel.config.js`
  - `/home/joshpointer/relay/apps/mobile/tsconfig.json`
  - `/home/joshpointer/relay/apps/mobile/app/_layout.tsx` (Clerk provider + Query provider)
  - `/home/joshpointer/relay/apps/mobile/app/(auth)/sign-in.tsx`
  - `/home/joshpointer/relay/apps/mobile/app/(app)/_layout.tsx` (guard)
  - `/home/joshpointer/relay/apps/mobile/lib/{secureStore.ts,api.ts,socket.ts,fonts.ts,theme.ts}`
- Definition of done:
  - Expo SDK 51, Expo Router v3, React Native 0.74, New Architecture OFF (MVP stability).
  - Clerk Expo SDK wired with `tokenCache` via `expo-secure-store`.
  - `fonts.ts` loads Poppins (400/500/600/700) + Inter (400/500) via `expo-font` from `@relay/design-tokens/assets/fonts` — splash held until fonts ready (BR-6).
  - `theme.ts` consumes `@relay/design-tokens` and produces an RN-friendly theme object.
  - `pnpm --filter @relay/mobile exec expo start` opens the dev server; sign-in screen renders.
- Acceptance: `pnpm --filter @relay/mobile exec expo export --platform web` succeeds (web bundle as proxy for compile correctness without simulator).

**WS-C-02 · Mobile SDK client + providers + push registration · WS-C · sonnet**
- Preconditions: WS-C-01, WS-A-06.
- Files:
  - `/home/joshpointer/relay/apps/mobile/lib/notifications.ts` (registers `expo-notifications` push token; posts to `/v1/push-tokens`)
  - `/home/joshpointer/relay/apps/mobile/components/providers/{QueryProvider.tsx,SocketProvider.tsx}`
- Definition of done:
  - On `(app)` group mount, requests notification permission, obtains Expo push token, posts to API.
  - Notification handler sets foreground behavior: show alert for non-DELIVERED, play sound for DELIVERED.
  - Taps deep-link via `router.push(/shipments/${data.shipmentId})`.
- Acceptance: in Expo Go, permission prompt appears and `PushToken` row is created server-side (manual test documented in `apps/mobile/README.md`).

**WS-C-03 · Mobile list screen · WS-C · sonnet**
- Preconditions: WS-C-02.
- Files:
  - `/home/joshpointer/relay/apps/mobile/app/(app)/index.tsx`
  - `/home/joshpointer/relay/apps/mobile/components/home/{HeaderLockup.tsx,ShipmentCard.tsx,FilterPills.tsx,Greeting.tsx,FAB.tsx,EmptyState.tsx}`
- Definition of done:
  - Header top-left: icon + wordmark full lockup (BR-24).
  - Greeting "Welcome back, {displayName}" in Inter Regular (BR-25).
  - Card elevated on white over `cloudGray` app bg (BR-26); status badge "In Transit" in `amber` (BR-27); location line in `agileTeal` (BR-28).
  - FAB bottom-right in `deepTechBlue` with white `+`, opens Add (BR-29).
  - Pull-to-refresh wired (§2.2 #15).
- Acceptance: Jest snapshot test renders the home screen with three mock shipments and asserts `ShipmentCard`'s status badge text color resolves to `#FFB800` for `IN_TRANSIT` via `react-native-testing-library` style inspection.

**WS-C-04 · Mobile detail screen + live updates · WS-C · opus**
- Preconditions: WS-C-03.
- Files:
  - `/home/joshpointer/relay/apps/mobile/app/(app)/shipments/[id].tsx`
  - `/home/joshpointer/relay/apps/mobile/components/detail/{MapPanel.tsx,InfoList.tsx,EventTimeline.tsx,StatusHeader.tsx,ShareSheet.tsx}`
- Definition of done:
  - Layout: top map panel (placeholder OK for MVP — a View with teal route stroke), below info list (tracking #, carrier logo, origin, destination, ETA), below timeline (newest first).
  - Subscribes via `SocketProvider` to `shipment:<id>`; `onTrackingEvent` prepends timeline; `onShipmentUpdated` mutates query cache.
  - Share sheet uses `expo-sharing` with share-link URL from API.
  - Copy tracking number to clipboard on long-press (§2.3 #17).
- Acceptance: Jest test with mocked socket asserts timeline prepends a new event within 1s of emitted `tracking:event`.

**WS-C-05 · Mobile add / notifications / profile screens · WS-C · sonnet**
- Preconditions: WS-C-04.
- Files:
  - `/home/joshpointer/relay/apps/mobile/app/(app)/add.tsx`
  - `/home/joshpointer/relay/apps/mobile/app/(app)/notifications.tsx`
  - `/home/joshpointer/relay/apps/mobile/app/(app)/profile.tsx`
  - `/home/joshpointer/relay/apps/mobile/content/strings.ts`
- Definition of done:
  - Add screen: paste field + optional nickname + submit; shows disambiguation carrier picker if API returns multiple candidates (§2.2 #10).
  - Notifications screen mirrors web: last 30, unread dot, tap to deep-link.
  - Profile screen: display name edit, notification prefs toggle (all / exceptions only / delivered only / off per §2.5 #29), delete account confirm (AC-12).
  - Strings locked per tone (BR-36..BR-40); no exclamation in negative events; single check for delivered (BR-40).
- Acceptance: Jest test on notification tap navigates to the correct shipment route.

**WS-C-06 · Mobile launcher + splash + app chrome · WS-C · sonnet**
- Preconditions: WS-C-01, WS-D-03a, WS-D-03b.
- Files:
  - `/home/joshpointer/relay/apps/mobile/app.config.ts` (icons, splash config)
  - `/home/joshpointer/relay/apps/mobile/assets/icon.png`, `adaptive-icon.png` (generated from `relay-launcher.svg` by WS-D script), `splash.png`
- Definition of done:
  - iOS icon set generated (1024/180/120/87/80/60/58/40/29/20) in `assets/ios/` (BR-23).
  - Android adaptive icon foreground/background layers (BR-23).
  - Splash: `deepTechBlue` bg with white icon.
- Acceptance: `pnpm --filter @relay/mobile exec expo config --type public | jq '.expo.icon'` returns the icon path; `file` command on the 1024×1024 PNG confirms dimensions.

**WS-C-07 · Empty / loading / error states + a11y · WS-C · sonnet**
- Preconditions: WS-C-05.
- Files:
  - `/home/joshpointer/relay/apps/mobile/components/states/{EmptyShipments.tsx,LoadingSkeleton.tsx,OfflineBanner.tsx}`
- Definition of done:
  - OfflineBanner listens to `NetInfo`; shows "Live updates paused" banner per §2.4 #27.
  - Respects `AccessibilityInfo.isReduceMotionEnabled()` — disables map camera animations + timeline slide-ins (§4.3).
  - Min 44×44 pt touch targets on all interactive elements.
- Acceptance: `jest-axe`-equivalent (`react-native-testing-library`) test finds no missing `accessibilityLabel`s on tappable components.

**WS-C-08 · Mobile tests · WS-C · sonnet**
- Preconditions: WS-C-07.
- Files:
  - `/home/joshpointer/relay/apps/mobile/__tests__/{home.test.tsx,detail.test.tsx,add.test.tsx,notifications.test.tsx,brand.test.tsx}`
  - `/home/joshpointer/relay/apps/mobile/jest.config.cjs`
- Definition of done:
  - Jest + `react-native-testing-library` + `@testing-library/jest-native` matchers configured via `@relay/config-jest` preset extended for RN.
  - Brand test imports `@relay/design-tokens` and asserts that `Button` primary uses `#003B73` (computed style via RNTL `toHaveStyle`).
- Acceptance: `pnpm --filter @relay/mobile test` green.

### Phase 3 — Brand implementation

*(WS-D-02 moved to Phase 2 — it is a precondition for WS-B-02/WS-C-02.)*

**WS-D-03a · Logo + icon SVGs (hand-authored) · WS-D · opus**
- Preconditions: WS-D-01.
- Files:
  - `/home/joshpointer/relay/packages/design-tokens/assets/logo/relay-lockup.svg` (dark on light)
  - `/home/joshpointer/relay/packages/design-tokens/assets/logo/relay-lockup-white.svg` (for nav)
  - `/home/joshpointer/relay/packages/design-tokens/assets/logo/relay-icon.svg` (R-as-looping-pathway, single continuous stroke, BR-14..BR-18)
  - `/home/joshpointer/relay/packages/design-tokens/assets/logo/relay-icon-white.svg`
  - `/home/joshpointer/relay/packages/design-tokens/assets/logo/relay-launcher.svg` (deepTechBlue tile + white icon + agileTeal accents, BR-19..BR-22)
  - `/home/joshpointer/relay/packages/design-tokens/assets/logo/README.md` (clear-space + min-size rules BR-12/BR-13)
- Definition of done:
  - Wordmark: uppercase `R`, lowercase `elay`, clean rounded-sans harmonizing with Poppins (BR-8..BR-11), horizontal stroke of `R` visually continues into the icon (BR-11). **BR-11 requires human reviewer sign-off recorded in `assets/logo/README.md` under a "Reviewer" section — checksum alone is insufficient.**
  - Icon: single continuous stroke forming an `R` whose tail becomes a forward arrow enclosing a small rectangle (package) (BR-14..BR-18).
  - Launcher: `#003B73` background, white icon, `#00C2CB` accents on arrow and/or package (BR-19..BR-22).
- Acceptance: `svgo --pretty --multipass` runs clean; human-reviewer attestation file present; SVG checksum snapshot captured by WS-D-04 item #8.

**WS-D-03b · Launcher icon generator script · WS-D · sonnet**
- Preconditions: WS-D-03a.
- Files:
  - `/home/joshpointer/relay/tooling/scripts/gen-launcher-icons.mjs` (uses `sharp` + `svgo`)
- Definition of done:
  - Script emits: `apps/mobile/assets/ios/*.png` (10 sizes 1024/180/120/87/80/60/58/40/29/20), `apps/mobile/assets/android/{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher_foreground.png` + `ic_launcher_background.xml`, `apps/web/public/icons/{favicon.ico,icon-192.png,icon-512.png,apple-touch-icon.png}` (BR-23).
- Acceptance: `node /home/joshpointer/relay/tooling/scripts/gen-launcher-icons.mjs` emits all PNGs; a follow-up test in WS-D-04 asserts dimensions.

**WS-D-03c · Font vendoring · WS-D · haiku**
- Preconditions: WS-D-01.
- Files:
  - `/home/joshpointer/relay/packages/design-tokens/assets/fonts/` (Poppins 400/500/600/700 + Inter 400/500 as WOFF2 + TTF)
  - `/home/joshpointer/relay/packages/design-tokens/assets/fonts/LICENSE.md` (SIL OFL 1.1 notice)
- Definition of done:
  - Fonts vendored; license text matches Google Fonts upstream; subset ranges documented in a README snippet.
- Acceptance: `ls` on the fonts dir shows all 12 required files; `head LICENSE.md` contains "SIL OFL 1.1".

**WS-D-04 · Brand acceptance tests · WS-D · opus**
- Preconditions: WS-D-03a, WS-D-03b, WS-D-03c, WS-B-06, WS-C-06.
- Files:
  - `/home/joshpointer/relay/packages/design-tokens/tests/brand.spec.ts`
  - `/home/joshpointer/relay/tooling/scripts/brand-audit.mjs`
- Definition of done (one per spec §7 item — all 10 required):
  1. Palette lock snapshot (JSON diff) for the 6 required hex codes.
  2. Primary button backgroundColor `#003B73` (web + RN).
  3. Delivered status resolves to `#2ECC71` and is referenced nowhere else (grep assertion on `apps/**/src/**`).
  4. Delayed/exception status uses `#FFB800`.
  5. Typography: headers compute to `Poppins`, body to `Inter` (web via Playwright `getComputedStyle`, RN via RNTL style).
  6. Contrast: every `color.text.*` on paired surface ≥ 4.5:1 (uses `wcag-contrast` package).
  7. `no-raw-hex` ESLint rule fails any hex outside tokens source.
  8. SVG checksum-pin: sha256 of each committed SVG matches `packages/design-tokens/tests/__snapshots__/svg-checksums.json`.
  9. Spacing scale: `no-arbitrary-spacing` lint rule forbids off-scale values in Tailwind arbitrary classes + RN StyleSheet numeric literals outside the scale set.
  10. Card radius = `tokens.radius.md` (8) and shadow = `tokens.shadow.card` — snapshot test.
  11. **Mockup visual regression (web).** Playwright `toHaveScreenshot()` captures the 3 required mockups (dashboard, shipment detail, notifications) against `apps/web/tests/__screenshots__/` pins. Tolerance `maxDiffPixelRatio: 0.02`. Regenerating requires `pnpm --filter @relay/web test:screenshots:update` + human diff review (logged in the PR body).
- Acceptance: `pnpm --filter @relay/design-tokens test` green; `node tooling/scripts/brand-audit.mjs` prints `BRAND AUDIT PASSED` and exits 0; `pnpm --filter @relay/web test:screenshots` green for the 3 pinned mockups.

### Phase 4 — Real-time + notifications
(Covered by WS-A-05, WS-B-04, WS-B-05, WS-C-02, WS-C-04, WS-C-05 above. No additional Phase-4-only task IDs — Phase 4 is verified by the following cross-workstream integration check.)

**WS-A-07 · End-to-end real-time smoke test · WS-A · sonnet**
- Preconditions: WS-A-05, WS-A-06.
- Files:
  - `/home/joshpointer/relay/apps/api/tests/e2e/realtime.spec.ts`
- Definition of done:
  - Spins up a supertest Fastify instance with an in-memory Socket.IO server (no Redis adapter in this test — single-node).
  - Simulates an EasyPost webhook; asserts within 2s the connected Socket.IO client receives `shipment:updated` + `tracking:event` with correct payloads, and `Notification` row is created.
- Acceptance (mock mode, default): `pnpm --filter @relay/api test -- -t "realtime"` green using `clerk.ts` + `webhook-hmac.ts` fixtures. Runs with zero env vars.

### Phase 5 — Polish
- Copy lock (WS-B-07, WS-C-05 content files): `strings.ts` checked via a content-lint script (`tooling/scripts/content-lint.mjs`) that fails on disallowed substrings: `!!`, `oopsie`, `lost in the void`, any celebratory emoji in negative-event strings (BR-36..BR-40).
- `WS-E-03 · content-lint workflow` (haiku): adds `tooling/scripts/content-lint.mjs` + wires it into `turbo.json` `test` pipeline. Acceptance: `pnpm -r test` includes content-lint pass.

### Phase 6 — Hardening

**WS-E-04 · CI workflow · WS-E · opus**
- Preconditions: WS-E-01, WS-A-02, WS-D-01.
- Files:
  - `/home/joshpointer/relay/.github/workflows/ci.yml`
  - `/home/joshpointer/relay/.github/workflows/tokens-audit.yml`
- Definition of done:
  - `ci.yml` jobs: `setup` (pnpm install cached) → `lint` → `typecheck` → `test` → `build`. Uses Turborepo remote cache if `TURBO_TOKEN` set; otherwise skips.
  - Postgres + Redis service containers for API integration tests.
  - `tokens-audit.yml` runs only when `packages/design-tokens/**` changes; builds tokens, diffs against committed snapshot, comments on PR.
  - Branch protection snippet documented in `docs/ops/branch-protection.md`.
- Acceptance: `act -W .github/workflows/ci.yml` or pushing a PR both result in green jobs.

**WS-E-05 · Root scripts + developer ergonomics · WS-E · haiku**
- Preconditions: WS-E-01.
- Files:
  - `/home/joshpointer/relay/package.json` (scripts block only)
  - `/home/joshpointer/relay/tooling/scripts/{bootstrap.mjs,reset-db.mjs}`
  - `/home/joshpointer/relay/README.md`
- Definition of done:
  - Root scripts: `dev`, `dev:api`, `dev:web`, `dev:mobile`, `db:up`, `db:down`, `db:migrate`, `db:seed`, `tokens:build`, `brand:audit`, `content:lint`.
  - README covers: prereqs (Node 20, pnpm 9, Docker), first-run commands, Clerk + EasyPost sandbox setup links, workstream map.
- Acceptance: a fresh clone + `pnpm install && docker compose up -d && pnpm db:migrate && pnpm db:seed && pnpm dev` brings all three apps online.

**WS-E-06 · Deployment configs locked + runbooks · WS-E · sonnet**
- Preconditions: WS-E-02, WS-E-04.
- Files:
  - `/home/joshpointer/relay/docs/runbooks/{deploy.md,secret-rotation.md,incident.md}`
  - `/home/joshpointer/relay/.github/workflows/{api-deploy.yml,mobile-eas.yml,db-migrate.yml}` (disabled by default; annotated `# requires secrets`)
- Definition of done:
  - Workflows reference the secret names from WS-E-02 env templates.
  - Runbooks cover the three scenarios; `deploy.md` includes `flyctl deploy --strategy rolling` and `prisma migrate deploy`.
  - `eas.json` references `EXPO_ACCESS_TOKEN`; `mobile-eas.yml` is `workflow_dispatch`-only to avoid cost surprises.
- Acceptance: `gh workflow list` shows all three as present; `actionlint` passes on every workflow.

---

## Section 4 — Shared conventions

- **Package manager:** `pnpm@9.x`. Enforced via `packageManager` field + `preinstall` script (`npx only-allow pnpm`).
- **Node version:** 20 LTS. `/home/joshpointer/relay/.nvmrc` = `20`. Root `engines.node = ">=20.11.0 <21"`. Volta pin documented.
- **Module system:** ESM everywhere (`"type": "module"`). Jest + Metro use their native transform shims.
- **Commit conventions:** Conventional Commits. Types allowed: `feat|fix|chore|docs|refactor|test|build|ci|style|perf`. Scopes match workstreams: `api|web|mobile|tokens|ui|infra|tooling`.
- **Branch strategy:** single `main`. Autopilot is one session — no per-workstream branches. Executors commit directly via the commit protocol with WS-prefixed scope. Each commit must reference a task ID in the footer (`Refs: WS-A-04a`).
- **Test runners (canonical — no contradictions allowed anywhere in plan):**
  - API + shared packages + web unit: **Vitest** (`vitest@^1`). API config: `apps/api/vitest.config.ts`, Node environment, globals off, coverage via `@vitest/coverage-v8`. Acceptance commands use `pnpm --filter <pkg> test -- -t "<name>"` (Vitest CLI).
  - Web e2e: **Playwright** (local-only in MVP CI, scheduled for CI once flake budget settled).
  - Mobile: **Jest** (`jest-expo` preset only — the RN community toolchain requires Jest; do not swap to Vitest).
  - No `jest.config.cjs` under `apps/api/`, `apps/web/`, or shared packages.
- **Linter/formatter:** **ESLint 9 flat config only.** Every `.eslintrc.*` is forbidden; each workspace ships `eslint.config.js`. The shared `@relay/config-eslint` exports a flat config array consumed via spread (`export default [...base, ...projectOverrides]`) — no legacy `extends` strings anywhere. Prettier 3. Prettier config: `singleQuote`, `semi`, `printWidth: 100`, `trailingComma: all`.
- **Type checking:** `tsc --noEmit` per workspace. Root `pnpm typecheck` runs `turbo run typecheck`. Shared tsconfig bases in `@relay/config-typescript`.
- **Runtime validation:** every API handler body/query validated via `@relay/shared-types` Zod schema before handler executes. SDK parses responses with the same schema.
- **Logging:** `pino` server-side with request-id; client-side errors flushed to Sentry. No `console.log` in committed code (ESLint rule `no-console: ["error", { allow: ["warn","error"] }]`).
- **Style guardrails:** ESLint custom rules `no-raw-hex` + `no-arbitrary-spacing` (authored in WS-D-02) enforce token-only styling. Fail the lint task, not runtime.
- **Docs:** All workstream docs under `/home/joshpointer/relay/docs/` (runbooks + ADRs). No per-workstream README proliferation — each package ships one README only if it has a public API.

---

## Section 5 — Parallel execution schedule

Executor batches: each batch lists tasks that have all their preconditions satisfied by prior batches. Three or more concurrent tasks is achievable starting at Batch 2.

**Batch 1 (serial — foundation cannot race itself):**
- `WS-E-01` (monorepo bootstrap)

**Batch 2 (3 concurrent):**
- `WS-E-02` (envs + deployment configs)
- `WS-D-01` (tokens package + Style Dictionary)
- `WS-A-01` (API scaffold + Prisma schema + Vitest config)

**Batch 3 (6 concurrent):**
- `WS-A-02` (shared-types Zod + status-map)
- `WS-D-02` (ui-core primitives — promoted to Phase 2)
- `WS-D-03a` (logos + icon SVGs, opus)
- `WS-D-03c` (fonts vendored, haiku)
- `WS-B-01` (web scaffold + Tailwind preset + Clerk middleware)
- `WS-C-01` (mobile scaffold + Clerk + fonts)

**Batch 4 (4 concurrent):**
- `WS-A-03` (Fastify + auth + /me + ships `tests/fixtures/clerk.ts`)
- `WS-A-05a` (notification copy catalog — depends only on WS-A-02)
- `WS-D-03b` (launcher icon generator script)
- `WS-E-03` (content-lint wired into turbo)
- `WS-E-05` (root scripts + README)

**Batch 5 (parallel on API critical path):**
- `WS-A-04a` (shipments CRUD + EasyPost adapter + MSW fixtures)

**Batch 6 (2 concurrent — once 04a lands):**
- `WS-A-04b` (webhook + HMAC + idempotency + circuit breaker)
- `WS-A-04c` (ShareLink model + public share route + rate-limit)

**Batch 7 (1 task consumes 04b + 05a):**
- `WS-A-05` (Socket.IO + fanout + push, consumes locked catalog)

**Batch 8 (2 concurrent — CI unlocks in parallel with SDK):**
- `WS-A-06` (@relay/sdk)
- `WS-E-04` (CI workflow — reachable once WS-A-02 + WS-D-01 done; can start earlier but must be green by MVP)
- `WS-D-04` (brand acceptance tests)

**Batch 9 (5 concurrent — the big UI build-out):**
- `WS-B-02` (web SDK providers)
- `WS-B-03` (web dashboard)
- `WS-C-02` (mobile push + providers)
- `WS-C-03` (mobile list)
- `WS-C-06` (mobile launcher/splash/chrome)

**Batch 10 (4 concurrent):**
- `WS-B-04` (web detail + share — consumes WS-A-04c)
- `WS-B-05` (web notifications)
- `WS-B-06` (web top nav + lockup)
- `WS-C-04` (mobile detail + real-time)

**Batch 11 (3 concurrent):**
- `WS-B-07` (web states + a11y + copy)
- `WS-C-05` (mobile add + notifications + profile)
- `WS-C-07` (mobile states + a11y)

**Batch 12 (3 concurrent — test + e2e):**
- `WS-A-07` (API e2e real-time smoke)
- `WS-B-08` (web tests)
- `WS-C-08` (mobile tests)

**Batch 13 (serial — release gate):**
- `WS-E-06` (deployment configs + runbooks, signed off after CI green)

Total: 13 batches. Critical path has 12 serialized steps (matches Section 2 rewrite). WS-E-04 is a parallel gate runnable as early as Batch 8.

---

## Section 6 — Verification plan

Commands the QA phase runs from `/home/joshpointer/relay`:

1. **Workspace install clean.** `pnpm install --frozen-lockfile` (allow fresh-lock on first run only).
2. **Typecheck.** `pnpm -r typecheck` — every workspace `tsc --noEmit` clean.
3. **Lint.** `pnpm -r lint` — ESLint across all workspaces with `@relay/config-eslint`. Must surface zero errors (warnings allowed only for docs-TODO comments).
4. **Unit + integration tests.** `pnpm -r test` — Vitest for `api`, `web`, `sdk`, `shared-types`, `design-tokens`, `ui-core`; Jest for `mobile`. Passes include:
   - `@relay/api`: shipments, webhook idempotency, socket fanout, real-time smoke (`WS-A-07`).
   - `@relay/web`: dashboard + detail + share Playwright specs (locally; CI runs vitest unit only in MVP).
   - `@relay/mobile`: home, detail, add, notifications, brand Jest specs.
   - `@relay/design-tokens`: 10-item brand acceptance suite (`WS-D-04`).
5. **Build.** `pnpm -r build` — API compiles to `apps/api/dist/`, web builds `.next/`, tokens emits `build/`, ui-core emits `dist/`, sdk emits `dist/`. Mobile is not "built" in CI (EAS does it); `pnpm --filter @relay/mobile exec expo export --platform web` runs as a proxy compile check.
6. **Brand audit script.** `node /home/joshpointer/relay/tooling/scripts/brand-audit.mjs` — imports `@relay/design-tokens` and asserts:
   - `tokens.color.brand.deepTechBlue === '#003B73'`
   - `tokens.color.brand.agileTeal === '#00C2CB'`
   - `tokens.color.state.alert === '#FFB800'`
   - `tokens.color.state.success === '#2ECC71'`
   - `tokens.color.neutral.cloudGray === '#F4F6F9'`
   - `tokens.color.neutral.inkBlack === '#1A1A1A'`
   - grep `#[0-9a-fA-F]{3,8}` under `apps/` returns zero matches (excluding `assets/` and `**/*.svg`).
   - all SVG checksums match pinned snapshot.
   - exit 0 with `BRAND AUDIT PASSED`.
7. **Content lint.** `node /home/joshpointer/relay/tooling/scripts/content-lint.mjs` — fails on forbidden substrings in `apps/*/content/strings.ts` + `apps/api/src/content/notifications.ts`.
8. **Docker build.** `docker build -f /home/joshpointer/relay/apps/api/Dockerfile /home/joshpointer/relay` — API image builds.
9. **DB migrate dry-run.** `pnpm --filter @relay/api prisma migrate status` against a fresh Postgres — reports all migrations applied cleanly.
10. **Acceptance smoke (manual or scripted in `tooling/scripts/mvp-smoke.mjs`):** start API + web, create a test user via Clerk test JWT, POST a sandbox EasyPost tracking number, assert the dashboard list shows 1 row within 5s and the detail route renders with timeline.

All ten above must pass for the autopilot run to be declared green.

---

## Section 7 — MVP cut vs v1

### MUST ship (non-negotiable for this autopilot run)
- Monorepo builds cleanly (`pnpm -r build` green).
- **API**:
  - Clerk auth plugin + `/v1/me` routes.
  - Shipment CRUD (`GET/POST/PATCH/DELETE /v1/shipments`, `GET /v1/shipments/:id`, `POST /v1/shipments/:id/refresh`, `GET /v1/shipments/:id/events`).
  - EasyPost adapter (USPS minimum; auto-detect on other carriers but marked "coming soon" in UI).
  - Webhook handler with HMAC + idempotency + transactional update.
  - Socket.IO `/rt` namespace with room-based broadcast.
  - Notifications CRUD + push-tokens CRUD + Expo push sender.
  - **Share link feature (MVP-in)**: `ShareLink` Prisma model, `POST /v1/shipments/:id/share` (auth, rate-limited 60/hour/user), `GET /v1/share/:token` public read-only view (no PII), default 7d TTL, 30d max, 410 on expired, 404 on invalid (AC-10; shipped by WS-A-04c).
  - **Locked notification copy catalog (MVP-in)**: `apps/api/src/content/notifications.ts` shipped by WS-A-05a, covers 15 transitions, tone-guarded, consumed by WS-A-05 and checked by content-lint.
- **Web**: 6 routes (`/`, `/sign-in`, `/dashboard`, `/shipments/[id]`, `/notifications`, `/share/[token]`). Map can be a placeholder with the required teal route line (BR-35). Brand applied on every route.
- **Mobile**: 5 screens (`sign-in`, `home` list, `add`, `shipments/[id]`, `notifications`). Profile is included as a settings modal hung off the header avatar. Brand applied; launcher icon + splash per spec.
- **Design tokens package** consumed by web (Tailwind preset + CSS vars) and mobile (RN TS). 10 brand acceptance tests pass.
- **CI workflow** runs typecheck + lint + test + build on PR; tokens-audit runs on token-change PRs.
- **Deployment configs** authored: Dockerfile, fly.toml, vercel.json, eas.json, GitHub workflows (live deploy not required in MVP — configs just need to be valid).

### Deferred to v1.1 (explicitly NOT in this autopilot run)
- Real map SDK (Mapbox or Google). Placeholder teal-route `<svg>` ships.
- Barcode scanner on mobile (open-question #11 in requirements §7).
- Social login (Sign in with Apple/Google) and the Apple-forced gate — open question #3.
- Web push notifications.
- Dark mode.
- i18n (en-US only).
- Offline queue on mobile (cache-only, no write queue, per A3).
- Email notifications beyond Clerk's built-in auth mails.
- Admin dashboard.
- Grafana/OpenTelemetry full dashboards (Sentry ships; Prometheus scrape endpoint exposed but not dashboarded).
- Team / org / shared-account features.
- Magic link UI (API/Clerk supports it; we omit the dedicated magic-link-only flow and rely on Clerk's default email-link sign-in).
- Live deploy execution (workflows exist but stay dispatch-only).

### Assumed defaults that ship in code (matching requirements §7)
- **A6 EasyPost** as carrier (not ShipEngine).
- **A10** map vendor: deferred — placeholder route line in `agileTeal` ships.
- **A12** Expo Push for push infra.
- Session TTLs: 30d mobile / 14d web — set on the Clerk app config, documented in `docs/ops/clerk.md`.
- 100-active-shipments cap: enforced as a config-driven limit `RELAY_ACTIVE_SHIPMENTS_CAP=100` in API env.
- Share link: default TTL 7 days, hard max 30 days; enforced in share-token validation (WS-A-04c). Open question about "30 days post-DELIVERED" noted in Appendix A.

---

## Section 8 — Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **EAS / native mobile builds require Apple Developer + Google Play accounts**, which the autopilot environment does not have, blocking device-level verification. | High | High | MVP runs `pnpm --filter @relay/mobile exec expo start` + Expo Go on a local device only. EAS configs are authored (`eas.json`, `mobile-eas.yml`) but the workflow is `workflow_dispatch`-only. Acceptance for mobile relies on Jest + RNTL, not a store binary. Documented in `docs/runbooks/deploy.md`. |
| 2 | **Cross-platform `ui-core` sharing becomes a tarpit** (spec risk #2); a component that works on RN breaks under `react-native-web`. | Medium | Medium | Strict charter in WS-D: `ui-core` limited to Button, Card, Badge, StatusPill, Text. Any component needing DOM-only or RN-only APIs moves to `ui-web` / `ui-mobile`. Lint rule rejects importing `react-native/Libraries/*` internals. Executors hitting the wall escalate, not push. |
| 3 | **EasyPost webhook signing + idempotency bugs** produce duplicate notifications or missed events. | Medium | High | Unique constraint on `TrackingEvent (shipmentId, occurredAt, status)` + unique on `WebhookEvent.externalId`. Hourly belt-and-suspenders cron poll (spec risk #1). Real-time e2e smoke test `WS-A-07` exercises the dedup path before WS-B/WS-C ship. |
| 4 | **Clerk configuration friction** — without live Clerk keys the executor cannot run authenticated integration tests. | Medium | Medium | Executors use Clerk's test-mode keys (documented in `apps/api/.env.example`); integration tests use a hand-signed JWT fixture under `apps/api/tests/fixtures/` that matches Clerk JWKS stubbed in tests. Live Clerk keys land in Fly/Vercel env during WS-E-06, not required for CI. |
| 5 | **Font + icon licensing + brand-asset drift**. SVGs get tweaked by an eager executor and break BR-11 (R-stroke continuation into icon) or the launcher accent colors. | Medium | Medium | SVG sha256 checksum-pinned (WS-D-04 test #8). Only WS-D is authorized to edit `packages/design-tokens/assets/`. PRs touching assets auto-run `tokens-audit.yml`. README in assets folder documents BR-8..BR-23 with visible do/don't examples. Poppins + Inter are OFL — license notice in assets README; no proprietary font replaces them. |

---

## Appendix A — Open questions carried forward

Persisted to `/home/joshpointer/relay/.omc/plans/open-questions.md`:

- [ ] Live map vendor (Mapbox vs Google Maps) — current plan ships a teal-route placeholder. Decide before v1.1.
- [ ] Sign in with Apple gate for iOS — blocks App Store submission if *any* other social login is added.
- [ ] Dark-mode intent — tokens are semantically layered but a second color file is needed to actually flip themes.
- [ ] Notification copy catalog (~15 transitions) — draft strings ship per tone guide; writer agent reviews in a follow-up lane.
- [ ] Real-time web transport confirmed as Socket.IO (spec §2.3); SSE was the open question — flagging in case product still wants to revisit.
- [ ] Share-link TTL confirmed at 30 days post-Delivered?
- [ ] Analytics vendor for MVP (PostHog/Amplitude/none) — currently nothing ships; Sentry is error-only.
- [ ] Barcode scan on mobile — currently deferred; Expo supports it cheaply for v1.1.
- [ ] 100-shipment cap — shipped as env-driven config; confirm as product cap vs cost guardrail.
- [ ] Tracking-event retention policy — default 90d post-archive, purge job not in MVP.

---

**End of plan.** Executors may begin Batch 1 (`WS-E-01`) immediately.
