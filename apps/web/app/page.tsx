import { ArrowRight, Bot, ClipboardCheck, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <Link href="/" className="font-heading text-lg font-semibold">Avivavirtual</Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
          <Link href="/services">Services</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/login" className="rounded bg-sky-600 px-3 py-2 text-white">Login</Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <h1 className="font-heading text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">Avivavirtual customer care</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">AvivaVirtual AI Agent for website visitors, ticket workflows, callback scheduling, VoIP.ms calling, and post-call Whisper summaries for Canadian businesses.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="focus-ring inline-flex items-center gap-2 rounded bg-sky-600 px-4 py-3 text-white">
              Start trial
              <ArrowRight size={18} />
            </Link>
            <Link href="/contact" className="focus-ring rounded border border-slate-300 px-4 py-3 text-slate-800">Contact</Link>
          </div>
        </div>
        <div className="panel bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded bg-sky-50 p-4 text-sky-900">
              <Bot size={24} />
              <p className="mt-3 text-sm font-medium">Approved KB AI</p>
            </div>
            <div className="rounded bg-emerald-50 p-4 text-emerald-900">
              <ClipboardCheck size={24} />
              <p className="mt-3 text-sm font-medium">Review queue</p>
            </div>
            <div className="rounded bg-rose-50 p-4 text-rose-900">
              <ShieldCheck size={24} />
              <p className="mt-3 text-sm font-medium">PIPEDA controls</p>
            </div>
          </div>
          <div className="mt-4 rounded bg-slate-900 p-4 text-white">
            <div className="flex items-center justify-between text-sm">
              <span>AI support inbox</span>
              <span className="rounded bg-emerald-500 px-2 py-1 text-xs">Review queued</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded bg-white/10 p-3 text-sm">Customer: Can I get help in French?</div>
              <div className="ml-auto max-w-[80%] rounded bg-sky-500 p-3 text-sm">AI: Yes, French support is available from the approved knowledge base.</div>
              <div className="rounded bg-white/10 p-3 text-sm">System: Confidence below threshold, support request queued.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
