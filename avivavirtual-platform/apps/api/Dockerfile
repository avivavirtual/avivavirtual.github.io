FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

FROM base AS deps

COPY pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages ./packages
COPY prisma ./prisma

RUN pnpm install --filter avivavirtual-platform --filter @avivavirtual/api... --frozen-lockfile=false --prod=false

FROM deps AS builder

COPY . .

RUN pnpm --filter @avivavirtual/api prisma:generate
RUN pnpm --filter @avivavirtual/api build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3001

CMD ["pnpm", "--filter", "@avivavirtual/api", "start:docker"]
