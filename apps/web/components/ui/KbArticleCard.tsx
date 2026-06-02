import { BookOpen, CheckCircle, Pencil } from "lucide-react"

export function KbArticleCard({ title, status, tags }: { title: string; status: string; tags: string }) {
  return (
    <article className="panel p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          <BookOpen size={18} />
        </span>
        <button className="focus-ring rounded p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`Edit ${title}`}>
          <Pencil size={16} />
        </button>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-500 dark:text-slate-300">{tags}</span>
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
          <CheckCircle size={13} />
          {status}
        </span>
      </div>
    </article>
  )
}
