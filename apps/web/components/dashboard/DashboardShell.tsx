"use client"

import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { useTheme } from "next-themes"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { ActiveCallPanel } from "@/components/voip/ActiveCallPanel"
import { IncomingCallToast } from "@/components/voip/IncomingCallToast"
import { SipProvider } from "@/components/voip/SipProvider"
import { clearDemoSession, getCurrentDemoUser, type DemoUser } from "@/lib/demo-auth"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "AI inbox", icon: MessageSquare },
  { href: "/dashboard/tickets", label: "Tickets", icon: ClipboardList },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/knowledge-base", label: "Knowledge base", icon: BookOpen },
  { href: "/dashboard/agents", label: "Agents", icon: Headphones },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/voip", label: "VoIP", icon: Phone },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/audit-logs", label: "Audit logs", icon: ShieldCheck }
]

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setCurrentUser(getCurrentDemoUser())
  }, [])

  function logout() {
    clearDemoSession()
    setCurrentUser(null)
    router.push("/login")
  }

  return (
    <SipProvider>
      <div className="grid min-h-screen grid-cols-[auto_1fr] bg-slate-50 dark:bg-slate-950">
        <aside className={`border-r border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900 ${collapsed ? "w-16" : "w-64"}`}>
          <div className="flex h-14 items-center justify-between gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
            <Link href="/dashboard" className="truncate font-semibold text-slate-900 dark:text-white">
              {collapsed ? "AV" : "Avivavirtual"}
            </Link>
            <button className="focus-ring rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setCollapsed(value => !value)} aria-label="Toggle sidebar">
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <nav className="space-y-1 p-2">
            {nav.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} className={`focus-ring flex h-10 items-center gap-3 rounded px-3 text-sm ${active ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"}`}>
                  <Icon size={18} />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              )
            })}
          </nav>
        </aside>
        <div className="min-w-0">
          <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input className="focus-ring h-9 w-full rounded border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Search" />
            </div>
            <div className="flex items-center gap-2">
              <button className="focus-ring rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
                <Bell size={18} />
              </button>
              <button className="focus-ring rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <span className="hidden max-w-48 truncate rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700 sm:inline" title={currentUser?.email || "Demo admin"}>
                {currentUser ? currentUser.businessName || currentUser.email : "CLIENT_ADMIN"}
              </span>
              <button className="focus-ring rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Log out" onClick={logout}>
                <LogOut size={18} />
              </button>
            </div>
          </header>
          <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
        </div>
      </div>
      <IncomingCallToast />
      <ActiveCallPanel />
      <Script
        id="aviva-dashboard-demo-widget"
        src="/widget/widget.js"
        data-org-id="demo"
        data-title="AvivaVirtual AI Agent"
        data-lang="en"
        data-api-url="demo"
        data-launcher-label="AvivaVirtual AI Agent"
        data-accent="#0EA5E9"
        data-demo="true"
        strategy="afterInteractive"
      />
    </SipProvider>
  )
}
