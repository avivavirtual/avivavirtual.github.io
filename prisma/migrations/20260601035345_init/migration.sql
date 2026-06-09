-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'OPS_MANAGER', 'CLIENT_ADMIN', 'AGENT', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'FR');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('VOICE', 'CHAT', 'EMAIL');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('QUEUED', 'AI_ACTIVE', 'ESCALATED', 'ASSIGNED', 'RESOLVED', 'CLOSED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_CLIENT', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgentAvailability" AS ENUM ('AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE', 'ON_CALL');

-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('PENDING', 'QUEUED', 'DOWNLOADING', 'TRANSCRIBING', 'SUMMARIZING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EscalationReason" AS ENUM ('LOW_CONFIDENCE', 'CUSTOMER_REQUEST', 'AGENT_OVERRIDE', 'COMPLEX_ISSUE', 'COMPLAINT', 'MAX_TURNS_REACHED');

-- CreateEnum
CREATE TYPE "IntentCategory" AS ENUM ('BILLING_INQUIRY', 'TECHNICAL_SUPPORT', 'ACCOUNT_MANAGEMENT', 'APPOINTMENT_SCHEDULING', 'GENERAL_INQUIRY', 'COMPLAINT', 'CANCELLATION', 'SALES', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "phoneNumber" TEXT,
    "availability" "AgentAvailability" NOT NULL DEFAULT 'OFFLINE',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0EA5E9',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentClientAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "AgentClientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPersona" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Ava',
    "greetingEN" TEXT NOT NULL DEFAULT 'Hi! I''m Ava, your virtual assistant. How can I help you today?',
    "greetingFR" TEXT NOT NULL DEFAULT 'Bonjour! Je suis Ava, votre assistante virtuelle. Comment puis-je vous aider?',
    "voiceEN" TEXT NOT NULL DEFAULT 'nova',
    "voiceFR" TEXT NOT NULL DEFAULT 'nova',
    "systemPromptEN" TEXT NOT NULL,
    "systemPromptFR" TEXT NOT NULL,
    "escalationMsgEN" TEXT NOT NULL DEFAULT 'I want to make sure you get the right help. Let me connect you with a specialist.',
    "escalationMsgFR" TEXT NOT NULL DEFAULT 'Je veux m''assurer que vous recevez la bonne aide. Je vous mets en contact avec un spécialiste.',
    "maxTurnsBeforeEscalate" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "retrievalTopK" INTEGER NOT NULL DEFAULT 5,
    "chatModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "suggestionModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "maxResponseTokens" INTEGER NOT NULL DEFAULT 600,
    "enableIntentClassify" BOOLEAN NOT NULL DEFAULT true,
    "enableAgenticTools" BOOLEAN NOT NULL DEFAULT true,
    "enableVoiceAI" BOOLEAN NOT NULL DEFAULT false,
    "ttsVoice" TEXT NOT NULL DEFAULT 'nova',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supportEmail" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "businessHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "businessHoursEnd" TEXT NOT NULL DEFAULT '17:00',
    "businessDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "afterHoursBehaviour" TEXT NOT NULL DEFAULT 'voicemail',
    "defaultLanguage" "Language" NOT NULL DEFAULT 'EN',
    "bilingualSupport" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLAConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "lowHours" INTEGER NOT NULL DEFAULT 72,
    "mediumHours" INTEGER NOT NULL DEFAULT 24,
    "highHours" INTEGER NOT NULL DEFAULT 8,
    "urgentHours" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLAConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientChannel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "Channel" NOT NULL,
    "identifier" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatWidget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "embedKey" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#0EA5E9',
    "headerLogoUrl" TEXT,
    "greetingEN" TEXT NOT NULL DEFAULT 'Hi! How can we help you today?',
    "greetingFR" TEXT NOT NULL DEFAULT 'Bonjour! Comment pouvons-nous vous aider?',
    "position" TEXT NOT NULL DEFAULT 'bottom-right',
    "requireEmail" BOOLEAN NOT NULL DEFAULT true,
    "requireName" BOOLEAN NOT NULL DEFAULT true,
    "requireConsent" BOOLEAN NOT NULL DEFAULT true,
    "showRating" BOOLEAN NOT NULL DEFAULT true,
    "allowedDomains" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientWebhook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "language" "Language" NOT NULL DEFAULT 'EN',
    "pipedaConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "externalId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "customerId" TEXT,
    "assignedAgentId" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'QUEUED',
    "language" "Language" NOT NULL DEFAULT 'EN',
    "intent" "IntentCategory",
    "intentConfidence" DOUBLE PRECISION,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalationReason" "EscalationReason",
    "aiSummary" TEXT,
    "aiTurns" INTEGER NOT NULL DEFAULT 0,
    "aiContained" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "ratedAt" TIMESTAMP(3),
    "wrapUpCode" TEXT,
    "wrapUpNotes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "tokensUsed" INTEGER,
    "aiConfidence" DOUBLE PRECISION,
    "retrievedChunks" JSONB,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseArticle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[],
    "category" TEXT,
    "sourceFileId" TEXT,
    "reviewedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseFile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "extractedText" TEXT,
    "pageCount" INTEGER,
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "articleIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "customerId" TEXT,
    "assignedAgentId" TEXT,
    "createdById" TEXT NOT NULL,
    "contactId" TEXT,
    "intent" "IntentCategory",
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSipCredentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sipUsername" TEXT NOT NULL,
    "sipPassword" TEXT NOT NULL,
    "subAccount" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSipCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT,
    "agentId" TEXT,
    "customerId" TEXT,
    "sipCallId" TEXT,
    "direction" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "billSeconds" INTEGER,
    "disposition" TEXT,
    "costCAD" DOUBLE PRECISION,
    "language" "Language",
    "aiHandled" BOOLEAN NOT NULL DEFAULT true,
    "aiTurns" INTEGER NOT NULL DEFAULT 0,
    "recordingUrl" TEXT,
    "recordingStoredUrl" TEXT,
    "recordingSize" INTEGER,
    "transcription" TEXT,
    "transcriptionLang" TEXT,
    "transcriptionAt" TIMESTAMP(3),
    "transcriptionModel" TEXT,
    "transcriptionCost" DOUBLE PRECISION,
    "summary" TEXT,
    "summaryAt" TIMESTAMP(3),
    "summaryModel" TEXT,
    "transcriptionStatus" "TranscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "transcriptionError" TEXT,
    "voicemailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallbackRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "reason" TEXT,
    "preferredTime" TEXT,
    "language" "Language" NOT NULL DEFAULT 'EN',
    "requestedVia" TEXT NOT NULL DEFAULT 'chat',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "status" TEXT NOT NULL DEFAULT 'active',
    "monthlyContacts" INTEGER NOT NULL DEFAULT 0,
    "agentSeats" INTEGER NOT NULL DEFAULT 3,
    "stripeCustomerId" TEXT,
    "stripeSubId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AgentClientAssignment_userId_organizationId_key" ON "AgentClientAssignment"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AIPersona_organizationId_key" ON "AIPersona"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AISettings_organizationId_key" ON "AISettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSettings_organizationId_key" ON "ClientSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SLAConfig_organizationId_key" ON "SLAConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientChannel_organizationId_type_identifier_key" ON "ClientChannel"("organizationId", "type", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "ChatWidget_organizationId_key" ON "ChatWidget"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatWidget_embedKey_key" ON "ChatWidget"("embedKey");

-- CreateIndex
CREATE UNIQUE INDEX "ClientWebhook_organizationId_toolName_key" ON "ClientWebhook"("organizationId", "toolName");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_email_key" ON "Customer"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseArticle_organizationId_title_key" ON "KnowledgeBaseArticle"("organizationId", "title");

-- CreateIndex
CREATE INDEX "Embedding_organizationId_idx" ON "Embedding"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_organizationId_ticketNumber_key" ON "Ticket"("organizationId", "ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AgentSipCredentials_userId_key" ON "AgentSipCredentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CallRecord_sipCallId_key" ON "CallRecord"("sipCallId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentClientAssignment" ADD CONSTRAINT "AgentClientAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentClientAssignment" ADD CONSTRAINT "AgentClientAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPersona" ADD CONSTRAINT "AIPersona_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISettings" ADD CONSTRAINT "AISettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSettings" ADD CONSTRAINT "ClientSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SLAConfig" ADD CONSTRAINT "SLAConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientChannel" ADD CONSTRAINT "ClientChannel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatWidget" ADD CONSTRAINT "ChatWidget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWebhook" ADD CONSTRAINT "ClientWebhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseArticle" ADD CONSTRAINT "KnowledgeBaseArticle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseFile" ADD CONSTRAINT "KnowledgeBaseFile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeBaseArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSipCredentials" ADD CONSTRAINT "AgentSipCredentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallbackRequest" ADD CONSTRAINT "CallbackRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
