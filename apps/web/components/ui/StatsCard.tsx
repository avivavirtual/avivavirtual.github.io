import type { LucideIcon } from "lucide-react"

export function StatsCard({ label, value, trend, icon: Icon }: { label: string; value: string | number; trend: string; icon: LucideIcon }) {
  const positive = !trend.startsWith("-")
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-300">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
          <Icon size={20} />
        </span>
      </div>
      <span className={`mt-3 inline-flex rounded px-2 py-1 text-xs ${positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
        {trend}
      </span>
    </div>
  )
}
