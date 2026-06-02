export default function EditArticlePage({ params }: { params: { id: string } }) {
  return (
    <form className="panel grid max-w-4xl gap-4 p-5">
      <h1 className="font-heading text-2xl font-semibold">Edit article {params.id}</h1>
      <input className="focus-ring rounded border border-slate-300 px-3 py-2" defaultValue="Billing cycle" />
      <textarea className="focus-ring min-h-80 rounded border border-slate-300 px-3 py-2" defaultValue="Invoices are issued monthly in Canadian dollars." />
      <button className="focus-ring rounded bg-sky-600 px-4 py-2 text-white">Publish</button>
    </form>
  )
}
