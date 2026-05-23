# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

RUN apk add --no-cache openssl

FROM base AS deps
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages ./packages
RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true pnpm install --filter @avivavirtual/web... --frozen-lockfile=false --prod=false

FROM deps AS builder
COPY . .
RUN pnpm --filter @avivavirtual/web build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000
CMD ["pnpm", "--filter", "@avivavirtual/web", "start"]
