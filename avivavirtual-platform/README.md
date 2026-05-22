# Avivavirtual Platform

## Overview
Avivavirtual is a multi-tenant, AI-powered customer care SaaS platform for Canadian businesses. This monorepo contains the API, web app, widget, mobile/macOS stubs, shared packages, and infrastructure/deployment assets.

## Architecture
- **apps/api**: NestJS + Prisma + PostgreSQL + Redis + JWT.
- **apps/web**: Next.js frontend and embeddable widget.
- **packages/shared**: Shared domain types/constants/utils.
- **packages/config**: Shared TypeScript/ESLint/Tailwind configs.
- **prisma/**: schema, migrations, and seed script.
- **docker-compose.yml**: local platform stack (Postgres, Redis, API, Web).

## Prerequisites
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

## Local Setup
1. Clone repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start local stack:
   ```bash
   docker compose up --build
   ```

## Running Migrations
```bash
pnpm --filter @avivavirtual/api exec prisma migrate dev --schema=prisma/schema.prisma
```

## Seeding Demo Data
```bash
pnpm --filter @avivavirtual/api exec ts-node /app/prisma/seed.ts
```

## Running Tests
```bash
pnpm lint
pnpm --filter @avivavirtual/api test
pnpm build
```

## Deployment Guides

### Web (Vercel)
- Connect repo in Vercel.
- Set `apps/web` as project root.
- Configure env vars from `.env.example`.
- Build command: `pnpm --filter ./apps/web build`.

### API (Render / Railway)
- Deploy `apps/api` via Dockerfile or Node runtime.
- Attach managed PostgreSQL + Redis.
- Run migrations during release (`prisma migrate deploy`).

### AWS ECS Notes
- Build/push `apps/api` and `apps/web` images to ECR.
- Run as separate ECS services behind ALB.
- Use Secrets Manager/SSM for env vars.
- Use RDS PostgreSQL and ElastiCache Redis.

### Azure App Service Notes
- Use Web App for Containers for API/web images.
- Configure startup command for API migrations.
- Use Azure Database for PostgreSQL + Azure Cache for Redis.
- Store secrets in Azure Key Vault.
