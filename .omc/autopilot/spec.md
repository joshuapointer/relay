# Relay — Technical Specification (Phase 0)

**Status**: Phase 0 Architecture — produced in parallel with analyst requirements
**Project root**: `/home/joshpointer/relay`
**Date**: 2026-04-22
**Author**: OMC Architect agent

> Relay is a cross-platform shipment tracking product (React Native mobile, React web, shared backend) with a "Trusted Clarity" brand system and real-time carrier-driven updates. This document is the single source of truth for Phase-0 technical decisions. Every section names concrete versions, packages, and boundaries so the executor phase can begin without re-deliberation.

---

## 0. Decision summary (one-line answers)

| Area | Decision |
|------|---------|
| Monorepo | **Turborepo 2.x** + **pnpm 9 workspaces** |
| Backend | **Node 20 LTS + Fastify 4** (TypeScript strict) |
| DB / ORM | **Postgres 16 + Prisma 5** |
| Real-time | **Socket.IO 4** (WebSocket, SSE fallback) |
| Auth | **Clerk** (managed, RN + web SDKs, org support) |
| Carrier | **EasyPost** (Tracker API + webhooks) |
| Web | **Next.js 14 App Router** + React 18 |
| Mobile | **Expo SDK 51** + **Expo Router v3** |
| Tokens | **Style Dictionary 4** → RN + Tailwind v3 |
| State | **TanStack Query v5** everywhere |
| Hosting | Expo EAS / **Vercel** / **Fly.io** / **Neon** |
| CI | **GitHub Actions** + Turborepo remote cache |

---

## 1. Monorepo layout

**Choice: Turborepo 2.x on top of pnpm 9 workspaces.**
Rationale: we have >2 apps with shared internal packages and want remote-cached CI. Plain pnpm workspaces work but force us to script task pipelines ourselves; Turborepo gives topological `build`/`lint`/`test` with near-zero config, and its remote cache (Vercel or self-hosted) cuts CI time materially once the `design-tokens` and `shared-types` packages become load-bearing. Nx is the alternative but its plugin system and generators add ceremony we do not need for a 3-app repo.

```
relay/
├── apps/
│   ├── mobile/                 # Expo SDK 51, Expo Router v3, React Native 0.74
│   │   ├── app/                # file-based routes
│   │   ├── components/
│   │   ├── lib/                # app-local hooks, push registration
│   │   ├── app.config.ts       # EAS + env-driven config
│   │   └── eas.json
│   ├── web/                    # Next.js 14 App Router, React 18
│   │   ├── app/                # route segments
│   │   ├── components/
│   │   ├── lib/
│   │   └── next.config.mjs     # transpilePackages for internal pkgs
│   └── api/                    # Fastify 4, Prisma 5, Socket.IO 4
│       ├── src/
│       │   ├── modules/        # shipments, tracking, users, webhooks, notifications
│       │   ├── plugins/        # auth, rate-limit, cors, sentry, socket
│       │   ├── jobs/           # BullMQ workers
│       │   └── server.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── Dockerfile
├── packages/
│   ├── design-tokens/          # source-of-truth tokens + Style Dictionary build
│   │   ├── tokens/             # *.json source (color, typography, spacing, radius, shadow, motion)
│   │   ├── build/              # generated: tokens.rn.ts, tokens.css, tailwind.preset.cjs, tokens.d.ts
│   │   └── style-dictionary.config.mjs
│   ├── ui-core/                # cross-platform primitives (RN + web via `react-native-web`) — Button, Card, Badge, StatusPill, Text
│   ├── ui-web/                 # web-only (Next.js) components that cannot share (complex tables, data grids)
│   ├── ui-mobile/              # RN-only components (BottomSheet, HapticPressable)
│   ├── sdk/                    # typed API client (openapi-fetch + Zod), generated from API contract
│   ├── shared-types/           # Zod schemas + inferred TS types (source of truth for API contract)
│   ├── config-eslint/          # shared ESLint config
│   ├── config-typescript/      # shared tsconfig bases
│   └── config-jest/            # shared Jest preset
├── tooling/
│   └── scripts/                # dev helpers (token-build watch, prisma wrappers)
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

**Boundary justifications**
- `design-tokens` is its own package because both RN and web must import *built artifacts* (not source JSON) so the brand audit CI can diff generated outputs against the spec. Keeping it separate from `ui-core` lets non-code consumers (design ops, Figma plugins) ingest the same JSON.
- `ui-core` exists only for primitives that render correctly under both React DOM and React Native. The moment a component needs `<div>`-only DOM APIs or RN-only `Animated` it moves to `ui-web`/`ui-mobile`. We will not attempt to share form controls beyond Button/Text/Badge/Card in MVP.
- `sdk` wraps `fetch` + Socket.IO client. Apps never call the API directly — they import `@relay/sdk`. This keeps auth header injection and retry policy in one place.
- `shared-types` is Zod-first. Zod schemas generate TS types and runtime validators. API inbound validation and SDK outbound parsing use the same schema — one fix propagates everywhere.

---

## 2. Tech stack decisions

### 2.1 Backend: Node 20 LTS + Fastify 4
Fastify over NestJS because Relay's API is a thin CRUD + webhook + socket surface, not a DDD service with dozens of modules. Fastify's plugin system, built-in JSON schema validation, and `@fastify/websocket` integration give us ~20k req/s on a small Fly machine without opinionated overhead. NestJS would add DI containers and decorators we do not need at this scale, and Fastify's ecosystem (`@fastify/rate-limit`, `@fastify/cors`, `@fastify/jwt`, `@fastify/multipart`) covers our needs. Node 20 LTS is supported until April 2026 and ships native test runner + fetch.

### 2.2 Database + ORM: Postgres 16 + Prisma 5
Postgres for relational integrity (shipments have many events, users many shipments), JSONB columns for heterogeneous carrier payloads, and battle-tested LISTEN/NOTIFY if we ever need pub/sub without Redis. Prisma 5 for type-safe queries, excellent migration DX, and first-class Neon/Supabase support. Trade-off acknowledged: Prisma's generated client is heavy and its raw-SQL escape hatch is clunky — if we hit a query we cannot express we will drop to `$queryRaw` with Zod validation rather than switch ORMs.

### 2.3 Real-time: Socket.IO 4
WebSocket via Socket.IO rather than raw `ws` or SSE. SSE is tempting for one-way server→client updates but we want room-based broadcast (`user:<id>`, `shipment:<id>`) and automatic reconnection with state recovery, both of which Socket.IO gives us free. SSE also struggles on React Native (requires polyfill) while Socket.IO has a stable RN client. For horizontal scale we attach the Redis adapter (`@socket.io/redis-adapter`) against the same Redis we use for BullMQ.

### 2.4 Auth: Clerk
Clerk over Auth0 and homegrown JWT because: (a) Clerk ships official React Native and Next.js App Router SDKs with middleware that integrates cleanly, (b) it handles email/password, social, and MFA without us owning credential storage, (c) it has a `getAuth()` helper for Fastify via JWT verification. Trade-off: **vendor lock-in and per-MAU pricing beyond 10k users** — we mitigate by keeping user IDs in our own `User` table keyed by `clerk_id` so a future migration to homegrown JWT+refresh is mechanical, not architectural. Auth0 is the fallback if Clerk pricing bites; homegrown is rejected for MVP because password reset, email verification, and session rotation are engineering months we do not have.

### 2.5 Carrier integration: EasyPost
EasyPost over ShipEngine because: (a) Tracker API covers 100+ carriers with a unified schema, (b) webhooks are reliable and documented, (c) test mode is robust with deterministic tracking numbers. ShipEngine has comparable coverage but its pricing skews toward high-volume shippers and its webhook signing is less clean. We will isolate carrier specifics behind a `CarrierAdapter` interface so ShipEngine or a second provider can be added later without touching domain code.

### 2.6 Web: Next.js 14 App Router
App Router (stable since 13.4) gives us React Server Components for shipment list/detail pages (less JS shipped, better LCP), route-level loading/error boundaries, and server actions for the rare mutation that bypasses the SDK. We pin to 14.2.x rather than 15 to avoid the still-shifting Turbopack and caching defaults. Trade-off: RSC forces a mental split between server and client components — we accept this for the SEO and performance wins on the public marketing/landing pages.

### 2.7 Mobile navigation: Expo Router v3
File-based routing mirrors Next.js App Router, which reduces cognitive switching for devs bouncing between apps. It replaces React Navigation's imperative config with typed routes and deep-link-first design. Requires Expo SDK 51 (bundled RN 0.74 + New Architecture opt-in).

### 2.8 Design tokens: Style Dictionary 4
Rather than a hand-rolled token pipeline. SD4 consumes our JSON source and emits RN-compatible TS, CSS custom properties, and a Tailwind preset from one source. We register custom transforms for our naming scheme (`color.state.delivered` → `colorStateDelivered` for RN, `--color-state-delivered` for CSS). Alternative (Theo, custom script) would be faster to start but harder to extend when we add dark mode or per-carrier theming.

### 2.9 State management: TanStack Query v5 (both platforms)
Single mental model across mobile and web. Shipment list/detail are server state — TanStack Query handles caching, background refetch, and optimistic updates. Client-only UI state uses `useState`/`useReducer`; we do not introduce Zustand/Redux in Phase 0. Socket.IO updates call `queryClient.setQueryData` to push into the cache without a refetch.

---

## 3. Data model (Prisma)

```prisma
// apps/api/prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db    { provider = "postgresql" url = env("DATABASE_URL") }

model User {
  id             String   @id @default(cuid())
  clerkId        String   @unique
  email          String   @unique
  displayName    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  shipments      Shipment[]
  notifications  Notification[]
  pushTokens     PushToken[]

  @@index([clerkId])
}

model Carrier {
  id             String   @id @default(cuid())
  code           String   @unique  // "usps","ups","fedex","dhl", matches EasyPost carrier_code
  displayName    String
  logoUrl        String?
  active         Boolean  @default(true)
  shipments      Shipment[]
}

enum ShipmentStatus {
  PENDING
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  EXCEPTION
  RETURNED
  UNKNOWN
}

model Shipment {
  id               String          @id @default(cuid())
  userId           String
  carrierId        String
  trackingNumber   String
  nickname         String?
  status           ShipmentStatus  @default(PENDING)
  estimatedDelivery DateTime?
  lastKnownLocation String?
  externalId       String?         // EasyPost tracker id
  isArchived       Boolean         @default(false)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  lastEventAt      DateTime?

  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  carrier          Carrier         @relation(fields: [carrierId], references: [id])
  events           TrackingEvent[]
  notifications    Notification[]

  @@unique([userId, carrierId, trackingNumber])   // prevent duplicates per user
  @@index([userId, status])
  @@index([externalId])
  @@index([updatedAt])
}

model TrackingEvent {
  id           String        @id @default(cuid())
  shipmentId   String
  status       ShipmentStatus
  description  String
  location     String?
  occurredAt   DateTime
  rawPayload   Json           // full carrier event, for debugging
  createdAt    DateTime       @default(now())

  shipment     Shipment       @relation(fields: [shipmentId], references: [id], onDelete: Cascade)

  @@unique([shipmentId, occurredAt, status])     // idempotency for webhook replays
  @@index([shipmentId, occurredAt(sort: Desc)])
}

enum NotificationChannel { PUSH EMAIL IN_APP }
enum NotificationKind { STATUS_CHANGE DELAY DELIVERED EXCEPTION }

model Notification {
  id           String               @id @default(cuid())
  userId       String
  shipmentId   String?
  kind         NotificationKind
  channel      NotificationChannel
  title        String
  body         String
  readAt       DateTime?
  sentAt       DateTime?
  createdAt    DateTime             @default(now())

  user         User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  shipment     Shipment?            @relation(fields: [shipmentId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, readAt])
}

model PushToken {
  id          String   @id @default(cuid())
  userId      String
  expoToken   String   @unique
  platform    String   // "ios","android"
  createdAt   DateTime @default(now())
  lastSeenAt  DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model WebhookEvent {
  id            String   @id @default(cuid())
  provider      String   // "easypost"
  externalId    String   @unique   // EasyPost event id for idempotency
  signature     String
  payload       Json
  processedAt   DateTime?
  error         String?
  receivedAt    DateTime @default(now())

  @@index([processedAt])
}
```

**Key indexes** target the hot paths: list user's active shipments (`userId, status`), webhook idempotency (`externalId` unique), recency ordering for notifications and events.

**Analyst input wanted**: retention policy for `TrackingEvent.rawPayload` (legal/PII), whether shipments are shared across users (e.g., team accounts) — I've modeled single-owner for MVP.

---

## 4. API surface

Base URL: `https://api.relay.app/v1`
All endpoints except `/webhooks/*` and `/health` require `Authorization: Bearer <clerk-jwt>`.

### REST

| Method | Path | Purpose |
|-------|------|---------|
| `GET` | `/health` | liveness/readiness |
| `GET` | `/me` | current user profile |
| `PATCH` | `/me` | update profile (displayName) |
| `GET` | `/carriers` | list supported carriers (cached, public behind auth) |
| `GET` | `/shipments` | list user's shipments; query: `status`, `archived`, `cursor`, `limit` |
| `POST` | `/shipments` | add shipment `{ trackingNumber, carrierCode?, nickname? }` — if `carrierCode` omitted, detect via EasyPost |
| `GET` | `/shipments/:id` | shipment detail with latest events |
| `PATCH` | `/shipments/:id` | update nickname or `isArchived` |
| `DELETE` | `/shipments/:id` | remove shipment (soft-archive; hard delete after 30d) |
| `POST` | `/shipments/:id/refresh` | force carrier re-poll (rate-limited 1/min) |
| `GET` | `/shipments/:id/events` | paginated tracking events |
| `GET` | `/notifications` | list; query: `unread=true`, `cursor` |
| `POST` | `/notifications/:id/read` | mark read |
| `POST` | `/notifications/read-all` | bulk mark read |
| `POST` | `/push-tokens` | register Expo push token `{ expoToken, platform }` |
| `DELETE` | `/push-tokens/:id` | unregister |
| `POST` | `/webhooks/easypost` | **public** — EasyPost push; HMAC-verified via `X-EasyPost-Hmac-Signature` |

### Error shape

```json
{ "error": { "code": "SHIPMENT_NOT_FOUND", "message": "...", "traceId": "..." } }
```

### WebSocket (Socket.IO namespace `/rt`)

Client connects with `auth: { token: <clerk-jwt> }`. Server verifies, joins rooms `user:<userId>` and (on subscribe) `shipment:<id>`.

| Direction | Event | Payload | Purpose |
|----|----|----|----|
| C→S | `shipment:subscribe` | `{ shipmentId }` | join shipment room |
| C→S | `shipment:unsubscribe` | `{ shipmentId }` | leave |
| S→C | `shipment:updated` | `Shipment` | status, ETA, or location change |
| S→C | `tracking:event` | `TrackingEvent` | new event appended |
| S→C | `notification:created` | `Notification` | new in-app notification |
| S→C | `error` | `{ code, message }` | transport/auth errors |

Heartbeat every 25s; auto-reconnect with exponential backoff in the Socket.IO client; on reconnect, client re-issues all active `shipment:subscribe` calls.

---

## 5. Real-time flow

```
┌─────────────┐      1. shipment status changes
│  Carrier    │──────────────────────────────────┐
│ (USPS/UPS)  │                                  │
└─────────────┘                                  ▼
                                        ┌──────────────────┐
                                        │    EasyPost      │
                                        │  (aggregator)    │
                                        └────────┬─────────┘
                                                 │ 2. POST /webhooks/easypost
                                                 │    (HMAC-signed)
                                                 ▼
                                        ┌──────────────────┐
                                        │  Fastify API     │
                                        │  - verify HMAC   │
                                        │  - upsert        │
                                        │    TrackingEvent │
                                        │  - update        │
                                        │    Shipment      │
                                        │  - enqueue job   │
                                        └────────┬─────────┘
                                                 │ 3. BullMQ job: fanout
                                                 ▼
                                        ┌──────────────────┐
                                        │   Redis (pub/sub │
                                        │   + job queue)   │
                                        └────────┬─────────┘
                                                 │
                       ┌─────────────────────────┼─────────────────────────┐
                       │                         │                         │
                       ▼                         ▼                         ▼
               ┌───────────────┐        ┌────────────────┐         ┌────────────────┐
               │  Socket.IO    │        │  Expo Push     │         │  Notification  │
               │  broadcast    │        │  (FCM/APNs)    │         │  row inserted  │
               │  room:        │        │  via           │         │  (in_app)      │
               │  user:<id>    │        │  expo-server-  │         │                │
               │  shipment:<id>│        │  sdk           │         │                │
               └───────┬───────┘        └────────┬───────┘         └────────────────┘
                       │                         │
            4. live UI update          5. background/terminated push
                       │                         │
          ┌────────────┼────────────┐            │
          ▼                         ▼            ▼
   ┌─────────────┐           ┌─────────────────────────┐
   │  Web app    │           │  Mobile (RN)            │
   │  TanStack   │           │  Notification handler   │
   │  cache      │           │  + TanStack cache       │
   └─────────────┘           └─────────────────────────┘
```

Push is always sent; sockets are best-effort. If the client is connected we still fire push but the client may dedupe by notification `id`.

---

## 6. Design token schema

**Source-of-truth shape** (`packages/design-tokens/tokens/`):

```jsonc
// color.json
{
  "color": {
    "brand":   { "deepTechBlue": { "value": "#003B73" },
                 "agileTeal":    { "value": "#00C2CB" } },
    "state":   { "alert":     { "value": "#FFB800" },
                 "success":   { "value": "#2ECC71" },
                 "delivered": { "value": "{color.state.success}" } },
    "neutral": { "cloudGray": { "value": "#F4F6F9" },
                 "inkBlack":  { "value": "#1A1A1A" },
                 "white":     { "value": "#FFFFFF" } },
    "text":    { "primary":   { "value": "{color.neutral.inkBlack}" },
                 "onPrimary": { "value": "{color.neutral.white}" } },
    "surface": { "base":      { "value": "{color.neutral.white}" },
                 "muted":     { "value": "{color.neutral.cloudGray}" } },
    "status":  { "pending":   { "value": "{color.brand.deepTechBlue}" },
                 "inTransit": { "value": "{color.brand.agileTeal}" },
                 "delayed":   { "value": "{color.state.alert}" },
                 "delivered": { "value": "{color.state.success}" },
                 "exception": { "value": "#D64545" } }
  }
}
```

```jsonc
// typography.json
{
  "typography": {
    "family": { "heading": { "value": "Poppins" },
                "body":    { "value": "Inter" } },
    "weight": { "regular": { "value": 400 },
                "medium":  { "value": 500 },
                "semibold":{ "value": 600 },
                "bold":    { "value": 700 } },
    "size":   { "xs":{"value":12}, "sm":{"value":14}, "md":{"value":16},
                "lg":{"value":18}, "xl":{"value":22}, "2xl":{"value":28}, "3xl":{"value":34} },
    "lineHeight": { "tight":{"value":1.2},"normal":{"value":1.4},"relaxed":{"value":1.6} }
  }
}
```

```jsonc
// spacing.json
{ "spacing": { "0":{"value":0},"1":{"value":4},"2":{"value":8},
               "3":{"value":12},"4":{"value":16},"6":{"value":24},
               "8":{"value":32},"12":{"value":48},"16":{"value":64} } }
```

```jsonc
// radius.json + shadow.json + motion.json
{ "radius":  { "sm":{"value":4},"md":{"value":8},"lg":{"value":12},"pill":{"value":999} } }
{ "shadow":  { "card": { "value": { "x":0,"y":2,"blur":8,"color":"rgba(26,26,26,0.08)" } } } }
{ "motion":  { "duration": { "fast":{"value":150},"base":{"value":250},"slow":{"value":400} } } }
```

**Generated RN consumption** (`packages/design-tokens/build/tokens.rn.ts`):

```ts
export const tokens = {
  color: { brand: { deepTechBlue: '#003B73', agileTeal: '#00C2CB' }, /* ... */ },
  spacing: { 0:0, 1:4, 2:8, 3:12, 4:16, 6:24, 8:32, 12:48, 16:64 },
  // ...
} as const;
```

```tsx
// apps/mobile usage
import { tokens } from '@relay/design-tokens';
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: tokens.color.brand.deepTechBlue,
    paddingHorizontal: tokens.spacing[4],
    borderRadius: tokens.radius.md,
  },
});
```

**Generated web consumption** — Tailwind preset:

```cjs
// packages/design-tokens/build/tailwind.preset.cjs
module.exports = {
  theme: {
    colors: {
      'brand-blue': '#003B73', 'brand-teal': '#00C2CB',
      'state-alert': '#FFB800', 'state-success': '#2ECC71',
      /* ... */
    },
    spacing: { 0:'0px',1:'4px',2:'8px',3:'12px',4:'16px',6:'24px',8:'32px',12:'48px',16:'64px' },
    fontFamily: { heading:['Poppins','sans-serif'], body:['Inter','sans-serif'] },
  },
};
```

```tsx
// apps/web usage
<button className="bg-brand-blue text-white px-4 py-2 rounded-md font-body">Track</button>
```

CSS custom properties are also emitted (`tokens.css`) for non-Tailwind consumers (e.g., inline styles in Email templates).

---

## 7. Brand acceptance tests

Automated under `apps/*/tests/brand.spec.ts` and `packages/design-tokens/tests/tokens.spec.ts`:

1. **Palette lock**: `tokens.color.brand.deepTechBlue === '#003B73'`, `agileTeal === '#00C2CB'`, `state.alert === '#FFB800'`, `state.success === '#2ECC71'`, `neutral.cloudGray === '#F4F6F9'`, `neutral.inkBlack === '#1A1A1A'`. Snapshot the entire generated JSON; CI diff fails on any drift.
2. **Primary button**: rendered Button (web + mobile, via React Native Testing Library / Playwright) has `backgroundColor` strictly equal to `#003B73`.
3. **Delivered state**: any component rendering a Shipment with `status === 'DELIVERED'` resolves `color.status.delivered` which must equal `#2ECC71` and only `#2ECC71`. A visual regression test (Playwright + `toHaveScreenshot`) pins the pill.
4. **Delayed state**: status `EXCEPTION`/delay notification uses `#FFB800`.
5. **Typography**: headers resolve to `Poppins`; body to `Inter`. Font load test verifies both fonts are bundled (no FOUT in web, preload via `next/font`).
6. **Contrast**: every `color.text.*` on its paired surface passes WCAG AA (4.5:1 for body). Scripted with `wcag-contrast` package over the token graph.
7. **No hex leakage**: `eslint-plugin-no-raw-hex` custom rule fails any `#[0-9a-f]{3,8}` literal outside `packages/design-tokens/tokens/`.
8. **Logo/icon integrity**: SVG assets checksum-pinned; CI fails if the committed SVG's sha256 changes without a matching brand ticket label.
9. **Spacing scale**: no style uses a raw pixel value outside the `spacing` scale (lint rule over StyleSheet and Tailwind arbitrary classes).
10. **Radius/shadow**: Cards use `radius.md` and `shadow.card` — asserted in component snapshot tests.

---

## 8. Deployment topology

```
┌────────────────────────┐     ┌──────────────────────────┐
│  Expo EAS Build/Submit │     │ Vercel (apps/web)        │
│  apps/mobile           │     │  Edge runtime for RSC    │
│  iOS + Android stores  │     │  ISR off; dynamic w/auth │
└──────────┬─────────────┘     └──────────────┬───────────┘
           │ OTA updates (EAS Update)         │
           ▼                                  ▼
      users' devices                  api.relay.app
                                             │
                                             ▼
                                 ┌───────────────────────┐
                                 │  Fly.io (apps/api)    │
                                 │  2x shared-cpu-1x     │
                                 │  (1 GB), autoscale    │
                                 │  Region: iad + sjc    │
                                 └───────┬───────────────┘
                                         │
                      ┌──────────────────┼──────────────────┐
                      ▼                  ▼                  ▼
              ┌───────────────┐  ┌────────────────┐  ┌──────────────┐
              │ Neon Postgres │  │ Upstash Redis  │  │ EasyPost API │
              │ (branch per   │  │ (BullMQ + SIO  │  │ (+ webhooks) │
              │  preview env) │  │  adapter)      │  │              │
              └───────────────┘  └────────────────┘  └──────────────┘
```

**Why Fly.io over Railway/Render**: multi-region deploys, WebSocket support without egress surprises, private 6PN networking to Upstash. **Why Neon over Supabase**: branch-per-PR Postgres is invaluable for preview envs, and we do not need Supabase's auth/storage (Clerk covers auth; S3/R2 covers object storage later).

**CI/CD (GitHub Actions)**

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `ci.yml` | PR | pnpm install (cache) → turbo `lint test build` (remote cache) → Playwright smoke on preview web |
| `api-deploy.yml` | push `main`, `apps/api/**` changed | build Docker → `flyctl deploy --strategy rolling` |
| `web-deploy.yml` | n/a — Vercel GitHub integration handles it | — |
| `mobile-eas.yml` | manual dispatch + weekly | `eas build --platform all --profile preview` or `production` |
| `db-migrate.yml` | after `api-deploy` success | `prisma migrate deploy` against prod DB (guarded by env) |
| `tokens-audit.yml` | PR touching `packages/design-tokens/**` | build tokens, diff against snapshot, post comment |

---

## 9. Security & secrets

- **Env layout**: every app has `.env.example`; dotenv-vault or direct Fly/Vercel env sync; no `.env` committed. Shared secrets (Clerk keys) live once in a `relay-shared` Vercel/Fly team and are pulled per-env.
- **Secret classes**: `CLERK_SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `EASYPOST_API_KEY`, `EASYPOST_WEBHOOK_SECRET`, `SENTRY_DSN`, `EXPO_ACCESS_TOKEN`. Rotation runbook committed at `docs/runbooks/secret-rotation.md`.
- **Auth flow**: Clerk issues short-lived JWT (5m) + refresh in client SDK. Fastify verifies via Clerk JWKS (`@clerk/fastify`). Socket.IO handshake reads the same JWT from `auth.token`.
- **CORS**: API allows `https://relay.app`, `https://*.relay.app`, `https://*.vercel.app` (preview), and Expo dev (`exp://` — dev only). Credentials enabled only for web origins.
- **Rate limiting**: `@fastify/rate-limit` — 100 req/min global per user, 1 req/min for `/shipments/:id/refresh`, 20 req/min for webhook path (per source IP; EasyPost-only in prod via IP allowlist).
- **Webhook auth**: EasyPost HMAC verified against `EASYPOST_WEBHOOK_SECRET` in constant-time compare. Replay-protected via `WebhookEvent.externalId` unique.
- **Input validation**: every handler uses a Zod schema from `@relay/shared-types`; Fastify rejects non-matching bodies before handler runs.
- **Data at rest**: Neon encryption-at-rest default; no PII beyond email + display name in MVP (tracking numbers are not regulated PII but treated as user data).
- **Mobile secure storage**: Clerk's Expo adapter uses `expo-secure-store` for refresh tokens.

---

## 10. Observability

- **Logs**: structured JSON via `pino` (Fastify default). Correlation via `X-Request-Id` propagated to Socket.IO and BullMQ jobs. Shipped to Fly.io's log router → BetterStack (or Axiom).
- **Errors**: **Sentry** in all three apps (`@sentry/nextjs`, `@sentry/react-native`, `@sentry/node`). Release tagged by git SHA; source maps uploaded in CI.
- **Metrics**: `fastify-metrics` → Prometheus endpoint scraped by Fly's built-in metrics + Grafana Cloud. Key dashboards: webhook latency, socket connection count, BullMQ queue depth, Prisma slow queries (>200ms).
- **Tracing**: OpenTelemetry SDK wired in API; traces to Grafana Tempo via OTLP. Defer mobile/web tracing to v1.1.
- **Alerts**: PagerDuty (or free-tier Grafana OnCall) on: API 5xx rate >1%, webhook processing backlog >500, DB connection pool exhaustion, Sentry release-health crash-free <99%.
- **Uptime**: BetterStack monitors on `/health` every 30s from 3 regions.

---

## 11. Phase-1 MVP cut

**Ship in MVP (Phase 1)** — aggressive scope, one end-to-end slice:
- Auth: email/password + Google via Clerk. No MFA, no org support.
- One carrier: **USPS via EasyPost** (code `usps`). Other carriers listed but disabled with "coming soon".
- Shipments: add (paste tracking number, auto-detect carrier but fall back to USPS), list (active only), detail (latest status + event timeline).
- Real-time: Socket.IO broadcast on status change. Client updates the detail screen live.
- Notifications: Expo push on status change and delivery. In-app notification list (no email).
- Mobile screens: Sign-in, Home (shipments list), Add Shipment, Shipment Detail, Notifications. 5 screens.
- Web screens: Landing, Sign-in, Dashboard (list), Shipment Detail, Notifications. 5 routes.
- Design tokens: full palette + typography + spacing + radius + shadow. Light mode only.
- Deployment: production Fly/Vercel/Neon; Expo EAS preview builds (TestFlight + Google internal).
- Observability: Sentry + BetterStack uptime. No Grafana dashboards yet.

**Defer to v1.1**:
- Additional carriers (UPS, FedEx, DHL) — enable EasyPost's auto-detect across all.
- Email notifications (SES or Resend).
- Dark mode (tokens already scoped — flip a provider).
- Share shipment / team accounts.
- Maps on detail screen (carrier event geocoding).
- Delivery window predictions / anomaly detection.
- Web push notifications.
- iPad/tablet optimization.
- OpenTelemetry tracing, Grafana dashboards.
- Offline mode for mobile (TanStack Query persister).

**MVP acceptance**: a user installs mobile app, signs up, pastes a USPS tracking number, sees it appear on web dashboard within 5 seconds (socket), and receives a push when status changes to `DELIVERED` within 60 seconds of the EasyPost webhook.

---

## 12. Risks & mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| 1 | **EasyPost webhook delivery is unreliable or delayed**, breaking the real-time promise. | Medium | High | Hourly cron polls `GET tracker` for active shipments as belt-and-suspenders; dedupe via `TrackingEvent` unique index. Display `last_checked_at` in UI so users understand freshness. |
| 2 | **Cross-platform component sharing (`ui-core`) becomes a tarpit** — divergence between RN and web traps devs. | High | Medium | Strict policy: `ui-core` only for primitives that are lossless on both. Anything platform-specific lives in `ui-web`/`ui-mobile`. Architectural review required to add a component to `ui-core`. |
| 3 | **Clerk pricing or outage lock-in**. | Low (outage) / Medium (pricing at scale) | High | Abstract user identity behind our own `User` table keyed by `clerkId`; session middleware is a single Fastify plugin, replaceable in a sprint. Document the homegrown-JWT fallback as a v2 ADR. |
| 4 | **Socket.IO horizontal scale complexity** once we exceed one API instance. | Medium | Medium | Redis adapter from day one even on single instance; load-test to 5k concurrent connections before v1.1. Circuit breaker: fall back to periodic polling if socket disconnects repeatedly. |
| 5 | **Brand drift** — designers or engineers introduce raw hex values or off-scale spacing, eroding Trusted Clarity. | High | Medium | Automated brand acceptance tests (§7) block merges; `tokens-audit.yml` posts diffs on PRs; quarterly "brand audit" script surfaces any drift across both apps. |

---

## Open questions for analyst

1. Retention policy for tracking event raw payloads (GDPR/CCPA implications of carrier PII)?
2. Team/shared shipments in scope for v1.1 or later? Impacts ownership model in `Shipment` table.
3. Internationalization — which locales at launch? Affects font subsets and token naming.
4. SLAs we're committing to (notification latency, uptime)? Drives observability alerting thresholds.
5. Expected MAU at launch and at 6 months? Drives Clerk tier, Fly machine sizing, Neon plan.
