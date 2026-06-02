const styles: Record<string, string> = {
  AVAILABLE: "bg-emerald-500",
  BUSY: "bg-amber-500",
  AWAY: "bg-sky-500",
  OFFLINE: "bg-slate-400"
}

export function AgentStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-200">
      <span className={`h-2.5 w-2.5 rounded-full ${styles[status] || styles.OFFLINE}`} />
      {status}
    </span>
  )
}
