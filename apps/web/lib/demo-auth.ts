export type DemoUser = {
  firstName: string
  lastName: string
  businessName: string
  email: string
  password: string
  createdAt: string
}

const USERS_KEY = "aviva_demo_users"
const CURRENT_USER_KEY = "aviva_demo_user"
const TOKEN_KEY = "aviva_access_token"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function getDemoUsers(): DemoUser[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USERS_KEY) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDemoUser(user: DemoUser) {
  const users = getDemoUsers()
  const email = normalizeEmail(user.email)
  const nextUser = { ...user, email }
  const nextUsers = [nextUser, ...users.filter(item => normalizeEmail(item.email) !== email)]
  window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
  setCurrentDemoUser(nextUser)
}

export function findDemoUser(email: string, password: string) {
  const normalized = normalizeEmail(email)
  return getDemoUsers().find(user => normalizeEmail(user.email) === normalized && user.password === password)
}

export function getCurrentDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CURRENT_USER_KEY) || "null")
    return parsed && typeof parsed.email === "string" ? parsed : null
  } catch {
    return null
  }
}

export function setCurrentDemoUser(user: DemoUser) {
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  window.localStorage.setItem(TOKEN_KEY, `demo-token-${normalizeEmail(user.email)}`)
}

export function clearDemoSession() {
  window.localStorage.removeItem(CURRENT_USER_KEY)
  window.localStorage.removeItem(TOKEN_KEY)
}
