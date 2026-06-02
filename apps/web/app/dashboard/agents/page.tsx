import { AgentStatusBadge } from "@/components/ui/AgentStatusBadge"

const agents = [
  ["Avery Agent", "AVAILABLE", "Registered"],
  ["Remi Agent", "BUSY", "Registered"],
  ["Maya Manager", "AWAY", "Not registered"]
]

export default function AgentsPage() {
  return (
    <section className="panel overflow-x-auto">
      <table className="w-full min-w-[620px]">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800">
          <tr>
            <th className="px-3 py-3">Agent</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">SIP</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(([name, status, sip]) => (
            <tr key={name} className="border-b border-slate-200 text-sm last:border-b-0 dark:border-slate-700">
              <td className="px-3 py-3 font-medium">{name}</td>
              <td className="px-3 py-3"><AgentStatusBadge status={status} /></td>
              <td className="px-3 py-3">{sip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
