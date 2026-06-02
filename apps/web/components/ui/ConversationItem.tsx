import { MessageCircle } from "lucide-react"

export function ConversationItem({ name, preview, time, status }: { name: string; preview: string; time: string; status: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 px-3 py-3 last:border-b-0 dark:border-slate-700">
      <span className="grid h-9 w-9 place-items-center rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <MessageCircle size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{name}</p>
          <span className="shrink-0 text-xs text-slate-500">{time}</span>
        </div>
        <p className="truncate text-sm text-slate-500 dark:text-slate-300">{preview}</p>
      </div>
      <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">{status}</span>
    </div>
  )
}
