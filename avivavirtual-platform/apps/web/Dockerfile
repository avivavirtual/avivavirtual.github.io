# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN pnpm install --frozen-lockfile=false

FROM deps AS builder
COPY . .
RUN pnpm --filter web... build || pnpm --filter ./apps/web build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.* ./apps/web/

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["pnpm", "exec", "next", "start", "-p", "3000"]
