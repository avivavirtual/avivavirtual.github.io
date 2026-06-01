import Link from 'next/link';

const industries = ['Telecom carriers', 'Real estate brokerages', 'Construction and builder agencies'];

export default function HomePage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">AvivaVirtual Platform v2</p>
        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">White-labelled AI customer care, backed by human AvivaVirtual agents.</h1>
        <p className="mt-6 max-w-3xl text-xl text-slate-300">We are not an internal help desk. AvivaVirtual operates outsourced voice, chat, and email support for enterprise clients, with tenant-specific RAG, bilingual AI, VoIP escalation, and a unified operations control plane.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/pricing" className="rounded-full bg-sky-400 px-6 py-3 font-semibold text-slate-950">View pricing</Link>
          <Link href="/how-it-works" className="rounded-full border border-white/20 px-6 py-3 font-semibold">See how it works</Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {industries.map((industry) => <div key={industry} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">{industry}</div>)}
        </div>
      </section>
    </main>
  );
}
