const tiers = [
  ["Free", "$0", "Widget preview and basic ticketing"],
  ["Starter", "$149", "AvivaVirtual AI Agent, tickets, and two staff seats"],
  ["Professional", "$399", "VoIP.ms, analytics, and Whisper summaries"],
  ["Enterprise", "Custom", "Data residency review and custom onboarding"]
]

export default function PricingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">Pricing</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiers.map(([name, price, text]) => (
          <section key={name} className="panel p-5">
            <h2 className="text-lg font-semibold">{name}</h2>
            <p className="mt-3 text-3xl font-semibold">{price}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
            <button className="focus-ring mt-5 w-full rounded bg-sky-600 px-3 py-2 text-sm text-white">Select</button>
          </section>
        ))}
      </div>
    </main>
  )
}
