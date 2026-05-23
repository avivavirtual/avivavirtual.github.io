import type {
  AISettings,
  AgentStatus,
  AuditLog,
  CallbackRequest,
  CallRecord,
  ClientSettings,
  Conversation,
  Customer,
  Embedding,
  KnowledgeBaseArticle,
  KnowledgeBaseFile,
  Message,
  Notification,
  Organization,
  SLAConfig,
  SubscriptionPlan,
  Ticket,
  TicketComment,
  User
} from '@prisma/client';

export type PrismaUser = User;
export type PrismaOrganization = Organization;
export type PrismaCustomer = Customer;
export type PrismaConversation = Conversation;
export type PrismaMessage = Message;
export type PrismaTicket = Ticket;
export type PrismaTicketComment = TicketComment;
export type PrismaKnowledgeBaseArticle = KnowledgeBaseArticle;
export type PrismaKnowledgeBaseFile = KnowledgeBaseFile;
export type PrismaEmbedding = Embedding;
export type PrismaAgentStatus = AgentStatus;
export type PrismaAuditLog = AuditLog;
export type PrismaNotification = Notification;
export type PrismaSLAConfig = SLAConfig;
export type PrismaClientSettings = ClientSettings;
export type PrismaAISettings = AISettings;
export type PrismaCallRecord = CallRecord;
export type PrismaCallbackRequest = CallbackRequest;
export type PrismaSubscriptionPlan = SubscriptionPlan;
