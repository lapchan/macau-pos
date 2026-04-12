# =============================================================================
# Macau POS — Production Dockerfile
# Multi-stage build for all 3 Next.js apps (admin, cashier, storefront)
# Usage: docker build --build-arg APP=admin -t macau-pos-admin .
# =============================================================================

# --------------- Base ---------------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# --------------- Dependencies ---------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc* ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/cashier/package.json ./apps/cashier/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
RUN pnpm install --frozen-lockfile

# --------------- Builder ---------------
FROM base AS builder
ARG APP
ARG BUILD_ID=dev
COPY --from=deps /app/ ./
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_ID=${BUILD_ID}
RUN pnpm --filter ${APP} build

# --------------- Runner ---------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ARG APP
ARG PORT=3000

# Copy standalone output + static/public assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP}/public ./apps/${APP}/public

# Bake APP into env so CMD can reference it at runtime
ENV APP_NAME=${APP}
ENV PORT=${PORT}

USER nextjs
EXPOSE ${PORT}

CMD node apps/${APP_NAME}/server.js
