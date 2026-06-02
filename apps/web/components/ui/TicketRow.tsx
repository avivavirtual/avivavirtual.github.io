export function TicketRow({ number, subject, priority, agent, sla }: { number: string; subject: string; priority: string; agent: string; sla: string }) {
  const priorityClass = priority === "URGENT" ? "bg-rose-50 text-rose-700" : priority === "HIGH" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"
  return (
    <tr className="border-b border-slate-200 text-sm last:border-b-0 dark:border-slate-700">
      <td className="px-3 py-3 font-medium">{number}</td>
      <td className="px-3 py-3">{subject}</td>
      <td className="px-3 py-3">
        <span className={`rounded px-2 py-1 text-xs ${priorityClass}`}>{priority}</span>
      </td>
      <td className="px-3 py-3 text-slate-500 dark:text-slate-300">{agent}</td>
      <td className="px-3 py-3">{sla}</td>
    </tr>
  )
}
