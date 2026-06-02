export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_URL

export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE"

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  })
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`)
  }
  return response.json() as Promise<T>
}

export const demoMetrics = [
  { label: "Open support requests", value: 18, trend: "+12%" },
  { label: "Tickets due today", value: 7, trend: "-8%" },
  { label: "AI review queue rate", value: "22%", trend: "+3%" },
  { label: "CSAT", value: "4.7", trend: "+0.2" }
]
