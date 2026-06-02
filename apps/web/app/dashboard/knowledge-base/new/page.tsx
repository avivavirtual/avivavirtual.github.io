export default function NewArticlePage() {
  return (
    <form className="panel grid max-w-4xl gap-4 p-5">
      <h1 className="font-heading text-2xl font-semibold">New article</h1>
      <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Title" />
      <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Tags" />
      <textarea className="focus-ring min-h-80 rounded border border-slate-300 px-3 py-2" placeholder="Approved support content" />
      <button className="focus-ring rounded bg-sky-600 px-4 py-2 text-white">Save</button>
    </form>
  )
}
