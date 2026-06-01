# AvivaVirtual Platform v2

AvivaVirtual is a Canadian B2B outsourced customer care company. The platform in this repository supports white-labelled customer support for enterprise clients: tenant-specific AI agents answer voice and chat first, retrieve approved client knowledge with RAG, and escalate to trained AvivaVirtual human agents when confidence, sentiment, policy, or customer request requires it.

## Architecture

```text
Customer voice/chat/email
  -> Client channel (DID, widget, inbox)
  -> Tenant-isolated Contact
  -> AI RAG pipeline (intent, embeddings, pgvector, grounded response)
  -> Built-in or client webhook tools
  -> Human AvivaVirtual agent escalation when needed
  -> Tickets, transcripts, analytics, audit logs
```

For a layperson-friendly architecture explanation with Mermaid diagrams for the system, code flow, chat flow, voice flow, and RAG flow, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
For final review commands and the npm-registry access note, see [`docs/FINAL_REVIEW.md`](docs/FINAL_REVIEW.md).

## Monorepo structure

```text
apps/
  web/      Next.js 14 dashboard and marketing site
  api/      NestJS API, AI orchestration, auth, contacts, tickets, VoIP
  widget/   Standalone Shadow DOM chat widget
  mobile/   Expo mobile agent app workspace
  macos/    Tauri desktop agent app workspace
  whisper/  FastAPI faster-whisper service
packages/
  shared/   Shared TypeScript domain types
  ui/       Shared React UI primitives
  config/   Shared TypeScript configuration
prisma/     Multi-tenant schema and seed data
```

## Quick start

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
docker compose up --build
```

## Seed credentials

| Role | Email | Password |
| --- | --- | --- |
| SUPER_ADMIN | `admin@avivavirtual.ca` | `SuperAdmin@123!` |
| OPS_MANAGER | `ops@avivavirtual.ca` | `OpsManager@123!` |
| AGENT | `agent1@avivavirtual.ca` | `Agent@123!` |
| AGENT | `agent2@avivavirtual.ca` | `Agent@123!` |
| AGENT | `agent3@avivavirtual.ca` | `Agent@123!` |
| CLIENT_ADMIN (Rogers) | `admin@rogers-demo.ca` | `ClientAdmin@123!` |
| CLIENT_ADMIN (Maple Leaf Realty) | `admin@mapleleaf-demo.ca` | `ClientAdmin@123!` |

## Tenant model

Every client tenant owns isolated configuration and data:

- Knowledge base articles, uploaded files, and pgvector embeddings.
- AI persona name, prompts, greeting, TTS voice, and escalation threshold.
- Inbound channels: VoIP.ms DID, widget embed key, and email inbox.
- Human agent assignments and availability.
- Tickets, contacts, messages, call records, callbacks, analytics, and audit logs.
- Widget branding, allowed domains, and PIPEDA consent settings.

## AI pipeline

The NestJS `RagService` implements the production path:

1. Classify intent with JSON output.
2. Embed the customer query with `text-embedding-3-small`.
3. Retrieve approved tenant chunks with pgvector and `organizationId` filtering.
4. Compute confidence from cosine similarity.
5. Generate a grounded answer in English or French.
6. Escalate and generate a concise handoff summary when confidence is below threshold.

## VoIP.ms setup guide

1. Enable the VoIP.ms API and restrict allowed API IPs to backend infrastructure.
2. Create one AI bridge SIP sub-account and store it in `VOIPMS_AI_SUBACCOUNT`.
3. Create human agent sub-accounts for browser JsSIP registration.
4. Use `toronto.voip.ms` and `webrtc.voip.ms` for Canadian data residency.
5. Enable WebRTC and codecs PCMU, PCMA, and OPUS.
6. Route each client DID either to AI bridge first or to hunt/ring-all fallback rules.

## Whisper microservice

`apps/whisper` is designed for DigitalOcean Toronto (`tor1`) deployment. It uses FastAPI, faster-whisper, ffmpeg conversion to 16 kHz mono WAV, VAD filtering, Prometheus metrics, structured service boundaries, and `X-API-Key` shared-secret authentication.

Run it independently:

```bash
docker compose -f docker-compose.whisper.yml up --build
```

Set `WHISPER_PROVIDER=self-hosted` and `WHISPER_SELF_HOSTED_URL=http://whisper:8000` to route transcription through this service.

## PIPEDA compliance notes

- Widget contact creation requires consent before the first message is processed.
- Audio can remain in Canada when the self-hosted Whisper deployment is used.
- Recording and transcript retention windows are configured through environment variables.
- Tenant data must always be filtered by `organizationId`.
- SIP passwords and webhook headers are stored encrypted at rest.
- Login, ticket changes, KB publishing, recording deletion, and org configuration changes belong in audit logs.

## Production checklist

- [x] Monorepo layout for API, web, widget, shared packages, Prisma, Docker, CI.
- [x] Complete multi-tenant Prisma schema with contacts, tickets, VoIP, AI, billing, and audit models.
- [x] Seed data for AvivaVirtual staff, Rogers Communications, Maple Leaf Realty, KB articles, contacts, tickets, and calls.
- [x] Initial NestJS API modules for auth, contacts, RAG, tickets, and VoIP.
- [x] Initial Next.js dashboard and marketing entry points.
- [x] Standalone embeddable widget with Shadow DOM and PIPEDA consent gate.
- [x] Self-hosted Whisper FastAPI service.
- [ ] Finish all CRUD controllers, guards, queues, WebSocket gateways, and automated tests before launch.
