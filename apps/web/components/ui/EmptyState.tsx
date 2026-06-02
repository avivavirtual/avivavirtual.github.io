import type { LucideIcon } from "lucide-react"

export function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="panel grid min-h-48 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-200">
          <Icon size={22} />
        </span>
        <h3 className="mt-4 text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>
      </div>
    </div>
  )
}
