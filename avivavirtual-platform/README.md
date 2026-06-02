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

## Architecture Diagrams
https://mermaid.ai/d/5f3d588d-c7ed-44ea-8437-9dc14c0b89b8
### System Context Diagram
This C4 Level 1 view shows Avivavirtual as a customer-care SaaS boundary. Customers use the web chat or embedded widget, while admins and agents use API-backed platform workflows. Gemini is the only active AI provider in the current API code; SMTP, S3, and telephony are configured as deployment placeholders.

```mermaid
flowchart TD
  Customer[fa:fa-user Customer]
  Agent[fa:fa-headset Agent]
  Admin[fa:fa-user-shield Admin]
  Super[fa:fa-user-cog Super Admin]
  Host[fa:fa-globe Host Site]

  subgraph Platform[Avivavirtual]
    Web[Web App]
    Widget[Chat Widget]
    API[API]
  end

  subgraph External[External]
    Gemini[Gemini API]
    SMTP[SMTP]
    S3[S3]
    Telco[Telephony]
  end

  Customer -->|uses HTTPS| Web
  Customer -->|uses HTTPS| Widget
  Host -->|loads script| Widget
  Agent -->|uses HTTPS| Web
  Admin -->|uses HTTPS| Web
  Super -->|uses HTTPS| Web
  Web -->|REST JSON| API
  Widget -->|REST JSON| API
  API -->|AI request| Gemini
  API -.->|email config| SMTP
  API -.->|upload config| S3
  API -.->|voice config| Telco

  classDef critical fill:#fff1f0,stroke:#d93025,stroke-width:3px;
  class Customer,Web,API critical;
```

### Container Diagram
This C4 Level 2 view maps the monorepo workspaces to deployable containers and supporting infrastructure. `apps/web` serves the Next.js UI and static widget, `apps/api` exposes the NestJS REST API, and Prisma persists tenant-scoped data in PostgreSQL with pgvector enabled. Redis is provisioned in Compose, but current rate limiting is implemented in-memory.

```mermaid
flowchart TD
  Browser[Browser]
  Site[Host Site]

  subgraph Mono[Monorepo]
    Web[Web App]
    Widget[Widget JS]
    API[API]
    Shared[Shared Types]
    Config[Config Pkg]
    Prisma[Prisma Schema]
  end

  subgraph Infra[Infra]
    DB[(Postgres)]
    Redis[(Redis)]
  end

  subgraph AI[AI]
    Gemini[Gemini API]
    Fallback[Local Reply]
  end

  Browser -->|HTTPS page| Web
  Site -->|script tag| Widget
  Browser -->|REST JSON| API
  Widget -->|REST JSON| API
  Web -.->|imports| Shared
  API -.->|imports| Shared
  Web -.->|uses| Config
  API -.->|uses| Config
  API -->|Prisma TCP| DB
  Prisma -.->|generates| API
  API -.->|reserved| Redis
  API -->|HTTPS JSON| Gemini
  API -->|no key| Fallback

  classDef critical fill:#fff1f0,stroke:#d93025,stroke-width:3px;
  class Browser,Web,API,DB critical;
```

### Component Diagram
This C4 Level 3 view drills into the NestJS API, the most critical container. Controllers receive REST requests, services enforce business logic, guards protect tenant/admin operations, and Prisma centralizes database access. Cross-cutting middleware handles request validation, security headers, rate limiting, audit context, CORS, cookies, and Swagger docs.

```mermaid
flowchart TD
  Client[Web Client]

  subgraph Edge[API Edge]
    Main[Main Boot]
    Docs[API Docs]
    Pipe[Validation]
    Filter[Error Filter]
    Rate[Rate Limit]
    Audit[Audit Log]
  end

  subgraph Auth[Auth]
    AuthCtrl[Auth Ctrl]
    AuthSvc[Auth Svc]
    Jwt[JWT Guard]
    Roles[Role Guard]
  end

  subgraph Chat[Messaging]
    ChatCtrl[Chat Ctrl]
    ChatSvc[Chat Svc]
  end

  subgraph Tenant[Tenant Ops]
    UserCtrl[User Ctrl]
    UserSvc[User Svc]
    OrgCtrl[Org Ctrl]
    OrgSvc[Org Svc]
  end

  subgraph Data[Data]
    PrismaSvc[Prisma Svc]
    DB[(Postgres)]
  end

  subgraph AI[AI]
    Gemini[Gemini API]
    Fallback[Local Reply]
  end

  Client -->|REST JSON| Main
  Main -->|routes| AuthCtrl
  Main -->|routes| ChatCtrl
  Main -->|routes| UserCtrl
  Main -->|routes| OrgCtrl
  Main -->|serves| Docs
  Main -->|pipes| Pipe
  Main -->|filters| Filter
  Main -->|middleware| Rate
  Main -->|middleware| Audit
  UserCtrl -->|Bearer JWT| Jwt
  OrgCtrl -->|Bearer JWT| Jwt
  Jwt -->|role check| Roles
  AuthCtrl -->|register/login| AuthSvc
  ChatCtrl -->|start/send| ChatSvc
  UserCtrl -->|CRUD users| UserSvc
  OrgCtrl -->|settings| OrgSvc
  AuthSvc -->|users/orgs| PrismaSvc
  ChatSvc -->|conversations| PrismaSvc
  UserSvc -->|users/status| PrismaSvc
  OrgSvc -->|org/settings| PrismaSvc
  PrismaSvc -->|SQL| DB
  ChatSvc -->|HTTPS| Gemini
  ChatSvc -->|fallback| Fallback

  classDef critical fill:#fff1f0,stroke:#d93025,stroke-width:3px;
  class Client,Main,ChatCtrl,ChatSvc,PrismaSvc,DB critical;
```

### Data Flow Diagram
This flow traces the two key implemented user journeys: customer chat and user login. The red critical path is the chat message lifecycle from browser submission through REST, AI reply generation, Prisma persistence, and response rendering. Login uses bcrypt and JWT access tokens, with refresh tokens stored as httpOnly cookies.

```mermaid
flowchart TD
  subgraph ChatFlow[Chat Flow]
    C1[Customer]
    C2[Web App]
    C3[Chat API]
    C4[Find Org]
    C5[Find Customer]
    C6[AI Reply]
    C7[(Messages)]
    C8[Render Chat]
  end

  subgraph AuthFlow[Auth Flow]
    A1[User]
    A2[Auth API]
    A3[Check Hash]
    A4[Sign JWT]
    A5[Set Cookie]
  end

  subgraph Stores[Stores]
    DB[(Postgres)]
    Gemini[Gemini API]
    Local[Local Reply]
  end

  C1 -->|submit message| C2
  C2 -->|POST /chat| C3
  C3 -->|query org| C4
  C4 -->|SQL| DB
  C3 -->|upsert customer| C5
  C5 -->|SQL| DB
  C3 -->|build prompt| C6
  C6 -->|HTTPS if keyed| Gemini
  C6 -->|fallback if empty| Local
  C3 -->|create records| C7
  C7 -->|SQL| DB
  C3 -->|201 JSON| C2
  C2 -->|show reply| C8

  A1 -->|email/password| A2
  A2 -->|read user| DB
  A2 -->|bcrypt compare| A3
  A3 -->|valid user| A4
  A4 -->|refresh token| A5
  A4 -->|access token| A1

  classDef critical fill:#fff1f0,stroke:#d93025,stroke-width:3px;
  class C1,C2,C3,C6,C7,C8,DB critical;
```

### Architecture Summary

- **Core pattern:** Modular monolith in a pnpm/Turbo monorepo. The backend is one NestJS API process split into Auth, Chat, Users, Organizations, Prisma, and common middleware modules.
- **Scalability:** Web and API can be scaled as separate containers. PostgreSQL is the stateful core; Prisma keeps data access centralized. Redis is provisioned but not yet used by the implemented API.
- **Potential SPOFs:** Single API container, single PostgreSQL instance, single Redis instance, and external Gemini dependency for enhanced AI replies. The current in-memory rate limiter resets per API process and does not coordinate across replicas.
- **Suggested improvements:** Add API healthchecks to Compose, bind Redis to localhost or keep it internal-only, move rate limiting/session state into Redis, add migrations instead of `db push` for production, and introduce queues/workers for file ingestion, AI jobs, and outbound notifications.

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
4. For Gemini-powered customer chat replies, edit `.env` and set `GEMINI_API_KEY` to your real Gemini API key. If you leave it empty or as a placeholder, the chat still works, but it uses a local fallback response instead of the Gemini API.
5. Start local stack:
   ```bash
   docker compose up --build
   ```

For host development with pnpm, start only the backing services in Docker and run the apps on your machine:
```bash
docker compose up -d postgres redis
DATABASE_URL=postgresql://postgres:password@localhost:5432/avivavirtual pnpm db:push
DATABASE_URL=postgresql://postgres:password@localhost:5432/avivavirtual pnpm db:seed
DATABASE_URL=postgresql://postgres:password@localhost:5432/avivavirtual pnpm dev
```

## Running Migrations
```bash
pnpm db:migrate
```

## Seeding Demo Data
```bash
pnpm db:seed
```

When running these commands from macOS against the Docker Compose Postgres service, use the host-mapped database URL:
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/avivavirtual pnpm db:migrate
DATABASE_URL=postgresql://postgres:password@localhost:5432/avivavirtual pnpm db:seed
```

The `postgres` hostname in `.env.example` is for containers on the Docker Compose network.

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
