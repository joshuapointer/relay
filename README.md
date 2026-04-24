# Relay

Relay is a cross-platform shipment tracking product built on a Turborepo monorepo. It provides real-time carrier-driven updates across a React Native mobile app (Expo SDK 51), a Next.js 14 web app, and a Fastify 4 API — all sharing types, design tokens, and UI primitives from internal workspace packages.

## Setup

```bash
# Requires Node 20 LTS and pnpm 9
node --version  # should be 20.x
pnpm --version  # should be 9.x

pnpm install
pnpm build
pnpm typecheck
pnpm lint
```

## Workspace layout

```
relay/
├── apps/
│   ├── api/        # Fastify 4 + Prisma 5 + Socket.IO 4  (@relay/api)
│   ├── web/        # Next.js 14 App Router               (@relay/web)
│   └── mobile/     # Expo SDK 51 + Expo Router v3        (@relay/mobile)
├── packages/
│   ├── design-tokens/   # Style Dictionary 4 token pipeline  (@relay/design-tokens)
│   ├── ui-core/         # Cross-platform primitives           (@relay/ui-core)
│   ├── shared-types/    # Zod schemas + inferred TS types     (@relay/shared-types)
│   ├── sdk/             # Typed API client                    (@relay/sdk)
│   ├── config-eslint/   # Shared ESLint 9 flat config         (@relay/config-eslint)
│   ├── config-tsconfig/ # Shared tsconfig bases               (@relay/config-tsconfig)
│   └── config-vitest/   # Shared Vitest config helper         (@relay/config-vitest)
└── turbo.json
```

## Implementation plan

See [`.omc/plans/autopilot-impl.md`](.omc/plans/autopilot-impl.md) for the full phased implementation plan and workstream decomposition.
