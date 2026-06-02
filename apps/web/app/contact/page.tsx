import { Mail, Send } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">Contact</h1>
      <form className="panel mt-8 grid gap-4 p-5">
        <label className="grid gap-1 text-sm">
          Name
          <input className="focus-ring rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Email
          <input className="focus-ring rounded border border-slate-300 px-3 py-2" type="email" />
        </label>
        <label className="grid gap-1 text-sm">
          Message
          <textarea className="focus-ring min-h-32 rounded border border-slate-300 px-3 py-2" />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Mail size={16} />
            hello@avivavirtual.com
          </span>
          <button className="focus-ring inline-flex items-center gap-2 rounded bg-sky-600 px-4 py-2 text-white">
            <Send size={16} />
            Send
          </button>
        </div>
      </form>
    </main>
  )
}
