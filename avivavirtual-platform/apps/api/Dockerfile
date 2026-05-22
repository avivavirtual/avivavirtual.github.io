# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile=false

FROM deps AS builder
COPY . .
RUN pnpm --filter @avivavirtual/api exec prisma generate --schema=/app/prisma/schema.prisma
RUN pnpm --filter @avivavirtual/api build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api/src ./apps/api/src

EXPOSE 3001
WORKDIR /app/apps/api
ENTRYPOINT ["sh", "-c", "pnpm exec prisma migrate deploy --schema=/app/prisma/schema.prisma && node dist/main.js"]
