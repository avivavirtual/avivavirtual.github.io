export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">Privacy Policy</h1>
      <div className="panel mt-8 space-y-4 p-5 text-sm leading-7 text-slate-700 dark:text-slate-200">
        <p>Avivavirtual processes support conversations, tickets, files, call records, and transcripts to provide customer care services for Canadian businesses.</p>
        <p>The support widget requires express consent before personal information is submitted. Customers may choose English or French support, and businesses can configure retention windows for recordings and transcripts.</p>
        <p>Call recordings default to 90 days of retention and transcripts default to 365 days. Authorized administrators may delete recordings earlier where required by policy or customer request.</p>
        <p>Self-hosted Whisper can be deployed in Toronto for clients with Canadian data residency requirements.</p>
      </div>
    </main>
  )
}
