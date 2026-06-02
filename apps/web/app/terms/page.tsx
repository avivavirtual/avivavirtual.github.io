export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">Terms of Service</h1>
      <div className="panel mt-8 space-y-4 p-5 text-sm leading-7 text-slate-700 dark:text-slate-200">
        <p>Avivavirtual provides software for customer care workflows, AI assistance, ticketing, VoIP integrations, and transcription processing.</p>
        <p>Businesses are responsible for configuring approved knowledge-base content, VoIP.ms account settings, user access, and retention policies that match their obligations.</p>
        <p>AI-generated responses are constrained to approved knowledge-base articles and should be queued for staff review when confidence is below the configured threshold.</p>
      </div>
    </main>
  )
}
