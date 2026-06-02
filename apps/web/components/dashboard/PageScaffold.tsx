import { BarChart3, Clock, MessageSquare, Ticket, Users } from "lucide-react"

import { ConversationItem } from "@/components/ui/ConversationItem"
import { KbArticleCard } from "@/components/ui/KbArticleCard"
import { StatsCard } from "@/components/ui/StatsCard"
import { TicketRow } from "@/components/ui/TicketRow"
import { demoMetrics } from "@/lib/api"

export function DashboardPageContent({ title, subtitle, mode = "overview" }: { title: string; subtitle: string; mode?: "overview" | "table" | "inbox" | "cards" }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>
        </div>
        <button className="focus-ring rounded bg-sky-600 px-3 py-2 text-sm text-white">New</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label={demoMetrics[0].label} value={demoMetrics[0].value} trend={demoMetrics[0].trend} icon={MessageSquare} />
        <StatsCard label={demoMetrics[1].label} value={demoMetrics[1].value} trend={demoMetrics[1].trend} icon={Ticket} />
        <StatsCard label={demoMetrics[2].label} value={demoMetrics[2].value} trend={demoMetrics[2].trend} icon={BarChart3} />
        <StatsCard label={demoMetrics[3].label} value={demoMetrics[3].value} trend={demoMetrics[3].trend} icon={Clock} />
      </div>
      {mode === "cards" ? <CardGrid /> : mode === "inbox" ? <SupportInboxLayout /> : <TicketTable />}
    </div>
  )
}

function TicketTable() {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-3 py-3">Number</th>
            <th className="px-3 py-3">Subject</th>
            <th className="px-3 py-3">Priority</th>
            <th className="px-3 py-3">Owner</th>
            <th className="px-3 py-3">SLA</th>
          </tr>
        </thead>
        <tbody>
          <TicketRow number="TKT-202606-0001" subject="Billing question" priority="HIGH" agent="Avery" sla="2h 10m" />
          <TicketRow number="TKT-202606-0002" subject="French support callback" priority="MEDIUM" agent="Remi" sla="6h 05m" />
          <TicketRow number="TKT-202606-0003" subject="Password reset" priority="URGENT" agent="Avery" sla="42m" />
        </tbody>
      </table>
    </div>
  )
}

function SupportInboxLayout() {
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="panel overflow-hidden">
        <ConversationItem name="Jordan Lee" preview="Can you help with my invoice?" time="2m" status="OPEN" />
        <ConversationItem name="Camille Roy" preview="Je souhaite une verification en francais." time="8m" status="REVIEW" />
        <ConversationItem name="Priya Singh" preview="Password reset link expired." time="12m" status="AI" />
      </div>
      <div className="panel min-h-96 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">AI conversation</h2>
          <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">Review queued</span>
        </div>
        <div className="space-y-3">
          <div className="mr-auto max-w-[70%] rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">I need help with a billing question.</div>
          <div className="ml-auto max-w-[70%] rounded bg-sky-600 p-3 text-sm text-white">I can answer from the approved policy and queue this for account-specific review.</div>
        </div>
      </div>
    </div>
  )
}

function CardGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <KbArticleCard title="Billing cycle" status="APPROVED" tags="billing, policy" />
      <KbArticleCard title="PIPEDA consent" status="APPROVED" tags="privacy, compliance" />
      <KbArticleCard title="Callback requests" status="APPROVED" tags="voice, support" />
      <div className="panel p-4">
        <div className="flex items-center gap-3">
          <Users className="text-sky-600" size={20} />
          <h3 className="font-semibold">Review coverage</h3>
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">2 reviewers active, 1 callback owner, 1 away</p>
      </div>
    </div>
  )
}
