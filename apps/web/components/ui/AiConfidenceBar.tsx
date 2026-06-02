export function AiConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-300">
        <span>AI confidence</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
        <div className="h-2 rounded bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
