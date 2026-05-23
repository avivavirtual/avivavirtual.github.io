# Avivavirtual Platform Architecture

## 1. System Overview

Avivavirtual is an AI-powered customer care SaaS platform designed for Canadian businesses that need bilingual (English/French), omnichannel customer support with AI-first deflection and seamless human escalation.

### Primary Users

- **Super Admin**
  - Manages platform-wide settings, plans, compliance defaults, and tenant lifecycle.
- **Client Admin**
  - Manages their organization configuration, users, departments, SLAs, channels, and knowledge base.
- **Agent**
  - Handles assigned conversations and tickets, collaborates via internal notes, and resolves escalated cases.
- **Customer**
  - Interacts via website chat widget (and future voice channels), receives AI and human support.

### Core Functional Areas

- Embeddable chat widget and unified inbox
- AI-assisted conversation handling with RAG grounding
- Human handoff and ticketing workflow
- SLA management and analytics
- Optional privacy-first local AI deployment mode

---

## 2. Multi-Tenant Design

Avivavirtual is implemented as a strict multi-tenant architecture where **every resource is scoped by `organizationId`**.

### Tenant Isolation Rules

1. **Database-level enforcement**
   - Prisma middleware automatically injects `organizationId` constraints for all tenant-bound models on reads/writes.
   - Mutations reject cross-tenant identifiers.
2. **API-level enforcement**
   - JWT claims include `organizationId`, `userId`, and role.
   - NestJS guards validate that incoming route params/body entities belong to the caller’s tenant.
3. **Service-layer enforcement**
   - Repository/service functions require tenant context in method signatures.
   - No “global” query path for tenant data.

### Tenant-Bound Entities (Examples)

- Conversations, messages, tickets
- Knowledge base documents/chunks/embeddings
- Agents, departments, SLA configs
- Audit logs, callback requests, call records

---

## 3. End-to-End Data Flow

1. Customer sends a message in the **Chat Widget**.
2. Widget sends payload to **REST API**.
3. API invokes **AI Module**.
4. AI Module runs **RAG pipeline**.
5. System returns either:
   - AI response, or
   - Escalation/handoff trigger.
6. On handoff/assignment updates, API emits **WebSocket events** to the agent dashboard.

---

## 4. AI Pipeline Overview

### Request Entry

- `POST /ai/chat` receives message payload with tenant and conversation context.

### Processing Steps

1. **Language Detection**
   - Detect English/French using OpenAI classification prompt.
2. **Embedding Generation**
   - User query embedded using `text-embedding-3-small`.
3. **Retrieval**
   - `pgvector` cosine similarity search returns top 5 **approved** KB chunks for `organizationId`.
4. **Prompt Construction**
   - Retrieved chunks injected into GPT-4o system context.
5. **Response Generation**
   - GPT-4o produces grounded answer.
6. **Confidence Scoring**
   - Composite score computed from retrieval quality and response uncertainty signals.
7. **Escalation Rule**
   - If confidence `< 0.6`, trigger handoff:
     - generate conversation summary,
     - assign agent,
     - notify dashboard.

---

## 5. Real-Time Architecture

- Transport: **Socket.io** on NestJS gateway.
- Authentication: JWT-backed socket auth with tenant scoping.
- Namespace strategy: per organization and role-aware rooms.

### Events

- `message:new`
- `message:typing`
- `conversation:assigned`
- `conversation:closed`
- `ticket:updated`
- `notification:new`

---

## 6. Security Model

### Identity & Session

- JWT access token: **15 minutes**
- JWT refresh token: **7 days** via httpOnly cookie

### Application Security

- Password hashing with bcrypt
- RBAC guards on every route
- Request rate limiting
- DTO validation with class-validator
- Audit logs on all mutating actions

### Privacy & Compliance (Canada / PIPEDA)

- Data minimization and purpose limitation
- Consent checkbox required for customer chat initiation
- Tenant-configurable data retention settings
- Data residency-aware deployment options (including local AI mode)
- Access logging and traceability for regulated operations

---

## Reference Mapping

### 1. Voice agent pipeline

**Pattern implemented:** Real-time STT → LLM → TTS pipeline with low-latency audio streaming.  
Each user utterance flows: Whisper STT → GPT-4o → TTS output, streamed back in chunks.  
Transport: WebRTC or WebSocket. Supports interruption handling (barge-in).  
Inspired by: pipecat-ai/pipecat (Python voice agent framework), livekit/agents (realtime voice AI orchestration).  
Applied in Avivavirtual: VoIP placeholder module, future voice agent session manager, call handling screen in macOS app.

### 2. Conversational AI, intent routing, and human handoff

**Pattern implemented:** Intent classification → entity extraction → dialogue state machine → routing rules.  
If intent = billing: route to billing department. If confidence < threshold: trigger handoff with summary.  
Inspired by: RasaHQ/rasa (NLU pipeline, dialogue management, handoff patterns).  
Applied in Avivavirtual: AI module routing logic, escalation triggers, conversation state machine, department assignment.

### 3. RAG knowledge base (approved content only)

**Pattern implemented:**
- Document ingestion (PDF, DOCX, TXT, CSV) → text extraction → chunking (500 tokens, 50-token overlap)
- Each chunk embedded with text-embedding-3-small → stored in pgvector
- On user query: embed query → cosine similarity search → retrieve top 5 chunks for this orgId
- Chunks injected as system context. AI answers ONLY from retrieved chunks.
- If no chunks retrieved OR similarity < 0.75: AI must not answer — escalate to human.

Inspired by: AWS Bedrock Knowledge Bases + Amazon Connect GenAI pattern (vector search + grounded answers + escalation).  
Applied in Avivavirtual: AI module, embedding service, KnowledgeBase module, pgvector schema.

### 4. Confidence scoring and no-answer fallback

**Pattern implemented:**
- Confidence score (0.0–1.0) computed from: number of matching chunks, average cosine similarity, presence of uncertainty phrases in LLM output
- If confidence < 0.6: AI responds exactly: "I want to make sure you get the right answer. I'll connect you with a support specialist."
- Handoff service assigns conversation to least-busy available agent, emits WebSocket event, generates chat summary

Applied in Avivavirtual: ai.service.ts answerQuestion(), handoff.service.ts, confidence score stored on every Message record.

### 5. Privacy-first local AI deployment mode (optional)

**Pattern implemented:**
- Replace OpenAI API with local Ollama (Mistral 7B or Llama 3.1)
- Replace cloud STT with local Whisper (whisper.cpp)
- Replace cloud TTS with local Coqui TTS
- All data stays on-premise. No external API calls. Suitable for enterprise clients with strict Canadian data residency requirements under PIPEDA.

Applied in Avivavirtual: AISettings model includes a "localMode" flag. When true, AI module routes to local Ollama endpoint instead of OpenAI.

### 6. Mobile agent inbox UX

**Pattern implemented:** Unified inbox with tabs (Unassigned | Mine | All). Each row shows customer avatar, name, last message preview, timestamp, SLA badge, unread count dot. Tap opens full conversation. AI suggested reply shown as tappable chip above keyboard. Push notification on new assignment.  
Inspired by: Customerly iOS app (mobile AI chat and unified inbox), Deskwoot iPhone app (omnichannel helpdesk, quick-reply flows).  
Applied in Avivavirtual: apps/mobile agent inbox screens, agent conversation detail screen.

### 7. Ticketing and SLA management

**Pattern implemented:** Ticket list with sortable columns (Priority, Status, SLA Deadline). SLA timer counts down in red when under 30 minutes. Status pipeline: New → Open → Pending → Resolved → Closed. Internal notes hidden from customer. Priority color badges: Low (gray), Medium (blue), High (orange), Urgent (red).  
Inspired by: Zendesk (ticket management, SLA indicators), Zoho Desk (AI-assisted replies, KB search in agent view), Freshdesk (automated tagging, CSAT collection).  
Applied in Avivavirtual: Tickets module, TicketTable component, SLA timer in web and mobile, SLAConfig model.

### 8. Analytics dashboard

**Pattern implemented:** KPI row (total conversations, open tickets, resolved, AI resolution rate, CSAT). Line chart: conversations over time with 7d/30d/90d toggle. Bar chart: tickets by priority. Pie chart: language breakdown (EN/FR). Agent performance leaderboard table. SLA breach count alert.  
Inspired by: Kapture CX (enterprise CX analytics, SLA management).  
Applied in Avivavirtual: Analytics module, /analytics page, admin dashboard KPI cards.

### 9. VoIP and call handling placeholder

**Pattern implemented:** Call queue UI, active call screen placeholder, post-call AI summary field, call record storage, callback request form. Real integration via Twilio or VoIP.ms added in Phase 2. Includes placeholders for SIP trunking and call forwarding config.  
Inspired by: Dialpad (AI voice platform, real-time coaching, call summary generation).  
Applied in Avivavirtual: VoIP placeholder module, CallRecord model, CallbackRequest model, call handling screen in macOS app.

### 10. Chat widget, chatbot flow, and unified inbox

**Pattern implemented:** Embeddable JS widget (floating button, chat panel, name/email capture, EN/FR language toggle). Conversation assignment shown in real-time. Internal agent notes separate from customer view. Agent takeover banner when AI hands off. Unified inbox with team collaboration on shared conversations.  
Inspired by: Engati (chatbot flow builder, channel routing), Verloop (agent handoff UI, resolution analytics), Respond.io (unified inbox, internal notes, AI message routing).  
Applied in Avivavirtual: avivavirtual-widget.js, ConversationsGateway, ChatPanel component, internal notes toggle.
