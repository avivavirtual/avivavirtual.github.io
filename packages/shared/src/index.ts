export type UserRole = "SUPER_ADMIN" | "CLIENT_ADMIN" | "AGENT" | "CUSTOMER"
export type Language = "EN" | "FR"
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"

export interface TenantScoped {
  id: string
  organization_id: string
  created_at: string
  updated_at: string
}

export const BRAND = {
  primary: "#0EA5E9",
  secondary: "#0F172A",
  accent: "#10B981",
  danger: "#EF4444"
} as const

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 10) return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  return value
}
