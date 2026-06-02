import { CallTranscriptPanel } from "@/components/voip/CallTranscriptPanel"

export default function VoipPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <section className="panel p-5">
        <h1 className="font-heading text-2xl font-semibold">VoIP</h1>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded bg-sky-50 p-4 text-sm text-sky-900">DID: active</div>
          <div className="rounded bg-emerald-50 p-4 text-sm text-emerald-900">Sub-accounts: 2</div>
          <div className="rounded bg-amber-50 p-4 text-sm text-amber-900">Callbacks: 4 open</div>
        </div>
        <div className="mt-6 rounded bg-slate-100 p-4 text-sm dark:bg-slate-800">Recent call records appear here with row expansion for transcripts.</div>
      </section>
      <CallTranscriptPanel callRecordId="demo-call" />
    </div>
  )
}
