import { CallTranscriptPanel } from "@/components/voip/CallTranscriptPanel"

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <section className="panel p-5">
        <h1 className="font-heading text-2xl font-semibold">Ticket {params.id}</h1>
        <p className="mt-2 text-sm text-slate-500">SLA countdown: 2h 10m</p>
        <div className="mt-6 rounded bg-slate-100 p-4 text-sm dark:bg-slate-800">Customer needs billing clarification and a callback after transcript review.</div>
        <form className="mt-5 grid gap-3">
          <textarea className="focus-ring min-h-28 rounded border border-slate-300 px-3 py-2" placeholder="Internal comment" />
          <button className="focus-ring rounded bg-sky-600 px-3 py-2 text-sm text-white">Add comment</button>
        </form>
      </section>
      <CallTranscriptPanel callRecordId="demo-call" />
    </div>
  )
}
