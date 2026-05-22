export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  AGENT = 'AGENT',
  CUSTOMER = 'CUSTOMER'
}

export enum TicketStatus {
  NEW = 'NEW',
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ConversationStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum AgentStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE'
}

export enum Language {
  EN = 'EN',
  FR = 'FR'
}

export enum Channel {
  CHAT = 'CHAT',
  EMAIL = 'EMAIL',
  VOICE = 'VOICE',
  SMS = 'SMS'
}

export interface TenantScoped {
  organizationId: string;
}

export interface User extends TenantScoped {
  id: string;
  email: string;
  name: string;
  role: Role;
  agentStatus?: AgentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation extends TenantScoped {
  id: string;
  customerName?: string;
  customerEmail?: string;
  status: ConversationStatus;
  language: Language;
  assignedAgentId?: string;
  channel: Channel;
  createdAt: string;
  updatedAt: string;
}

export interface Message extends TenantScoped {
  id: string;
  conversationId: string;
  senderId?: string;
  senderRole: Role;
  content: string;
  confidenceScore?: number;
  createdAt: string;
}

export interface Ticket extends TenantScoped {
  id: string;
  conversationId?: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId?: string;
  slaDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export const CONFIDENCE_THRESHOLD = 0.6;
export const MAX_CHUNK_SIZE = 500;

export function formatDate(value: string | number | Date, locale = 'en-CA'): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function truncateText(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function generateSessionId(prefix = 'sess'): string {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${random}`;
}
export * from './types/prisma.types';
