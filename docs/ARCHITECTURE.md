# AvivaVirtual Platform Architecture

This document explains the platform in plain language first, then shows the code and customer-contact flows with Mermaid diagrams.

## Plain-language summary

AvivaVirtual runs customer support on behalf of many client companies. A Rogers customer, for example, may call or chat with what looks like Rogers support, but AvivaVirtual's platform answers first with a Rogers-trained AI agent. If the AI is unsure, it passes the customer, the conversation history, and a short summary to a human AvivaVirtual agent assigned to Rogers.

The most important rule is tenant isolation: each client has its own knowledge base, AI personality, channels, agents, analytics, tickets, and branding. A Rogers answer must never use Maple Leaf Realty data.

## 1. Whole-platform architecture

```mermaid
flowchart TB
  Customer[End customer\nCaller or website visitor]
  ClientSite[Client website or DID\nRogers, Bell, realtor, builder]
  Widget[Embedded chat widget\nShadow DOM]
  Voip[VoIP.ms DID + SIP/WebRTC]
  API[NestJS API\nAuth, contacts, tickets, AI, VoIP]
  DB[(PostgreSQL 15\nPrisma + pgvector)]
  Redis[(Redis + BullMQ queues)]
  OpenAI[OpenAI\nchat, embeddings, TTS]
  Whisper[Whisper service\nFastAPI, faster-whisper]
  Web[Next.js dashboard\nAvivaVirtual ops + client admins]
  Agent[Human AvivaVirtual agent\nweb, mobile, or macOS]

  Customer --> ClientSite
  ClientSite --> Widget
  ClientSite --> Voip
  Widget --> API
  Voip --> API
  Web --> API
  Agent --> Web
  API --> DB
  API --> Redis
  API --> OpenAI
  API --> Whisper
  API --> Agent
```

## 2. Tenant isolation model

```mermaid
flowchart LR
  ControlPlane[AvivaVirtual control plane]
  Rogers[Rogers tenant\nKB, persona Aria, DID, widget, agents]
  Realty[Maple Leaf Realty tenant\nKB, persona Alex, widget, agents]
  Builder[Builder tenant\nKB, persona, channels, agents]
  Vector[(pgvector embeddings\nfiltered by organizationId)]

  ControlPlane --> Rogers
  ControlPlane --> Realty
  ControlPlane --> Builder
  Rogers --> Vector
  Realty --> Vector
  Builder --> Vector
```

Every database query that touches customer, contact, ticket, KB, embedding, or call-record data must include the tenant's `organizationId` unless the caller is a permitted AvivaVirtual cross-client role.

## 3. Code flow for a widget message

```mermaid
sequenceDiagram
  participant Browser as Customer browser
  participant Widget as widget.ts
  participant Contacts as ContactsController
  participant Service as ContactsService
  participant RAG as RagService
  participant DB as Prisma/Postgres
  participant LLM as OpenAI

  Browser->>Widget: Customer types message
  Widget->>Widget: Verify PIPEDA checkbox
  Widget->>Contacts: POST /contacts/widget/:embedKey
  Contacts->>Service: startWidgetContact(embedKey, body, origin)
  Service->>DB: Validate embed key + allowedDomains
  Service->>DB: Create customer/contact in tenant
  Widget->>Contacts: POST /contacts/widget/:contactId/message
  Contacts->>Service: receiveWidgetMessage(contactId, content)
  Service->>DB: Store CUSTOMER message
  Service->>RAG: chat(organizationId, query, history)
  RAG->>LLM: classify intent + embed query
  RAG->>DB: Retrieve approved chunks filtered by organizationId
  RAG->>LLM: Generate grounded answer or handoff summary
  Service->>DB: Store AI message + intent + confidence
  Service-->>Widget: AI answer or escalation notice
  Widget-->>Browser: Render response with safe DOM text nodes
```

## 4. Chat escalation flow

```mermaid
flowchart TD
  Start[Customer sends chat] --> Consent{PIPEDA consent?}
  Consent -- No --> Block[Block message and ask for consent]
  Consent -- Yes --> Save[Save customer message]
  Save --> Retrieve[Retrieve tenant KB chunks]
  Retrieve --> Confidence{Confidence >= threshold?}
  Confidence -- Yes --> Answer[AI answers customer]
  Confidence -- No --> Summary[Generate handoff summary]
  Summary --> Escalate[Mark contact ESCALATED]
  Escalate --> Queue[Show in human agent queue]
  Queue --> AgentReply[Agent replies with full history]
```

## 5. Voice flow

```mermaid
sequenceDiagram
  participant Caller as Caller
  participant DID as VoIP.ms DID
  participant Voice as Voice AI bridge
  participant Whisper as Whisper STT
  participant RAG as RagService
  participant TTS as OpenAI TTS
  participant Agent as Human agent SIP browser

  Caller->>DID: Calls client support number
  DID->>Voice: Route audio to AI bridge SIP account
  Voice->>Whisper: Send speech audio for transcription
  Whisper-->>Voice: Return transcript
  Voice->>RAG: Ask tenant-specific question
  RAG-->>Voice: Answer + confidence + escalation flag
  alt AI confident
    Voice->>TTS: Convert answer to speech
    TTS-->>Voice: Audio response
    Voice-->>Caller: Play AI answer
  else Escalation needed
    Voice-->>Caller: Play transfer message
    Voice->>Agent: SIP REFER / incoming call with summary
    Agent-->>Caller: Human support continues
  end
```

## 6. RAG decision flow

```mermaid
flowchart LR
  Query[Customer question] --> Intent[Classify intent]
  Intent --> Embed[Create query embedding]
  Embed --> Search[Search pgvector\nWHERE organizationId = tenant]
  Search --> Score[Average top-K scores]
  Score --> Gate{Score below threshold?}
  Gate -- No --> Prompt[Prompt with KB chunks + recent history]
  Prompt --> Response[Grounded bilingual answer]
  Gate -- Yes --> Handoff[Escalation message + agent summary]
```

## 7. What each app owns

```mermaid
flowchart TB
  API[apps/api\nNestJS business logic]
  Web[apps/web\nDashboards + marketing]
  Widget[apps/widget\nEmbeddable customer chat]
  Whisper[apps/whisper\nCanadian self-hosted transcription]
  Shared[packages/shared\nShared domain types]
  UI[packages/ui\nReusable React UI]
  Prisma[prisma\nSchema + seed data]

  Web --> Shared
  Web --> UI
  Widget --> API
  API --> Shared
  API --> Prisma
  API --> Whisper
```
