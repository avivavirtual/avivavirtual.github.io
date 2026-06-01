export const ROLES = ['SUPER_ADMIN', 'OPS_MANAGER', 'CLIENT_ADMIN', 'AGENT', 'CUSTOMER'] as const;
export type Role = typeof ROLES[number];
export const CHANNELS = ['VOICE', 'CHAT', 'EMAIL'] as const;
export type Channel = typeof CHANNELS[number];
export const INTENTS = ['BILLING_INQUIRY','TECHNICAL_SUPPORT','ACCOUNT_MANAGEMENT','APPOINTMENT_SCHEDULING','GENERAL_INQUIRY','COMPLAINT','CANCELLATION','SALES','OTHER'] as const;
export type IntentCategory = typeof INTENTS[number];
export type Language = 'EN' | 'FR';
export interface TenantScoped { organizationId: string; }
export interface RagResponse {
  answer: string;
  confidence: number;
  chunks: Array<{ id?: string; text: string; score: number; articleTitle?: string }>;
  intent?: IntentCategory;
  intentConfidence?: number;
  shouldEscalate: boolean;
  escalationReason?: 'LOW_CONFIDENCE' | 'CUSTOMER_REQUEST' | 'COMPLEX_ISSUE' | 'MAX_TURNS_REACHED';
  handoffSummary?: string;
}
export interface WidgetConfig {
  embedKey: string;
  primaryColor: string;
  greetingEN: string;
  greetingFR: string;
  requireConsent: boolean;
  requireEmail: boolean;
  requireName: boolean;
}
