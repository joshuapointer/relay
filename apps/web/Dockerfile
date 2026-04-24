# syntax=docker/dockerfile:1
# ── Stage 1: fetch dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS deps
LABEL org.opencontainers.image.source="https://github.com/relay-app/relay"

RUN corepack enable

WORKDIR /app

# Copy workspace manifest files needed for pnpm fetch
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config-eslint/package.json packages/config-eslint/
COPY packages/config-tsconfig/package.json packages/config-tsconfig/
COPY packages/config-vitest/package.json packages/config-vitest/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/sdk/package.json packages/sdk/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/ui-core/package.json packages/ui-core/
COPY apps/web/package.json apps/web/

RUN pnpm fetch

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM deps AS build

WORKDIR /app

COPY tsconfig.base.json ./
COPY packages/config-tsconfig packages/config-tsconfig/
COPY packages/shared-types packages/shared-types/
COPY packages/sdk packages/sdk/
COPY packages/design-tokens packages/design-tokens/
COPY packages/ui-core packages/ui-core/
COPY apps/web apps/web/

RUN pnpm install -r --prefer-offline

# Build with Next.js standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @relay/web build

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
LABEL org.opencontainers.image.source="https://github.com/relay-app/relay"
LABEL org.opencontainers.image.version="0.1.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output and static assets
COPY --from=build --chown=nodeuser:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nodeuser:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nodeuser:nodejs /app/apps/web/public ./apps/web/public

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
