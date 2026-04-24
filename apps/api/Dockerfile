# syntax=docker/dockerfile:1
# ── Stage 1: fetch dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS deps
LABEL org.opencontainers.image.source="https://github.com/joshuapointer/relay"

RUN apk add --no-cache openssl
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
COPY apps/api/package.json apps/api/

RUN pnpm fetch

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM deps AS build

WORKDIR /app

# Copy full source for packages the API depends on
COPY tsconfig.base.json ./
COPY packages/config-tsconfig packages/config-tsconfig/
COPY packages/shared-types packages/shared-types/
COPY packages/sdk packages/sdk/
COPY apps/api apps/api/

RUN pnpm install -r --prefer-offline

RUN pnpm --filter @relay/shared-types build
RUN pnpm --filter @relay/api prisma:generate
RUN pnpm --filter @relay/api build

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
LABEL org.opencontainers.image.source="https://github.com/joshuapointer/relay"
LABEL org.opencontainers.image.version="0.1.0"

RUN apk add --no-cache openssl
RUN corepack enable

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

WORKDIR /app

# Copy built artifacts
COPY --from=build --chown=nodeuser:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nodeuser:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=build --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodeuser:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Copy workspace packages so pnpm symlinks in node_modules resolve at runtime
COPY --from=build --chown=nodeuser:nodejs /app/packages/shared-types ./packages/shared-types
COPY --from=build --chown=nodeuser:nodejs /app/packages/config-tsconfig ./packages/config-tsconfig

# Copy prisma client artifacts
COPY --from=build --chown=nodeuser:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=nodeuser:nodejs /app/package.json /app/pnpm-workspace.yaml ./

USER nodeuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
