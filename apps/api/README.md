# @relay/api

Fastify 4 + Prisma 5 + Socket.IO 4 backend for Relay.

## Prerequisites

- Node 20+
- pnpm 9+
- PostgreSQL 16 (or a Neon connection string)

## Run locally

1. Copy env file and fill in secrets:
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL, CLERK keys, EASYPOST_API_KEY
   ```

2. Install dependencies (from monorepo root):
   ```bash
   pnpm install
   ```

3. Generate Prisma client:
   ```bash
   pnpm --filter @relay/api prisma:generate
   ```

4. Run database migrations:
   ```bash
   pnpm --filter @relay/api prisma:migrate
   ```

5. Seed carriers:
   ```bash
   pnpm --filter @relay/api exec tsx prisma/seed.ts
   ```

6. Start dev server:
   ```bash
   pnpm --filter @relay/api dev
   ```

The API will be available at `http://localhost:4000`.

## Health check

```bash
curl http://localhost:4000/health
# {"status":"ok","version":"0.1.0"}
```

## Tests

```bash
pnpm --filter @relay/api test
```

Tests run in mock mode by default — no external credentials required.
Set `CLERK_MOCK_MODE=true` (already in `.env.example`) to use local JWT fixtures instead of real Clerk.
