import { OutboundCallButton } from "@/components/voip/OutboundCallButton"

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Customer {params.id}</h1>
          <p className="mt-1 text-sm text-slate-500">jordan@example.ca - +1 416 555 0111</p>
        </div>
        <OutboundCallButton phoneNumber="4165550111" customerName="Jordan" />
      </section>
      <section className="panel p-5">
        <h2 className="font-semibold">History</h2>
        <p className="mt-3 text-sm text-slate-500">5 conversations · 3 tickets · 2 calls</p>
      </section>
    </div>
  )
}
