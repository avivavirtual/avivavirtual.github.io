export default function NewTicketPage() {
  return (
    <form className="panel grid max-w-3xl gap-4 p-5">
      <h1 className="font-heading text-2xl font-semibold">Create ticket</h1>
      <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Subject" />
      <select className="focus-ring rounded border border-slate-300 px-3 py-2">
        <option>LOW</option>
        <option>MEDIUM</option>
        <option>HIGH</option>
        <option>URGENT</option>
      </select>
      <textarea className="focus-ring min-h-40 rounded border border-slate-300 px-3 py-2" placeholder="Description" />
      <button className="focus-ring rounded bg-sky-600 px-4 py-2 text-white">Create</button>
    </form>
  )
}
