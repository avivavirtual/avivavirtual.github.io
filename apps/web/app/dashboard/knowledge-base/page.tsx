import { Bot, CheckCircle2, FileText, Search } from "lucide-react"

const sources = [
  {
    title: "Billing cycle",
    status: "APPROVED",
    tags: "billing, invoice, policy",
    excerpt: "Invoices are corrected or reissued after account review. Customers should provide invoice number, billing email, and requested change."
  },
  {
    title: "Password reset",
    status: "APPROVED",
    tags: "login, password, account",
    excerpt: "Customers should use the password reset link, check inbox and spam, then provide the account email and exact error if access still fails."
  },
  {
    title: "Callback requests",
    status: "APPROVED",
    tags: "phone, callback, support",
    excerpt: "Callback requests collect phone number, preferred time window, and reason before staff follow-up."
  },
  {
    title: "PIPEDA consent",
    status: "APPROVED",
    tags: "privacy, consent, retention",
    excerpt: "The widget requires express consent before personal information is submitted and processed for support."
  }
]

const examples = [
  {
    question: "How do I reset my invoice?",
    answer: "Invoices are corrected or reissued rather than reset. The AI asks for the invoice number, billing email, and requested change.",
    source: "Billing cycle",
    confidence: "0.86"
  },
  {
    question: "I need help logging in",
    answer: "The AI recommends the password reset link, checking spam, and sharing the account email plus exact error if access still fails.",
    source: "Password reset",
    confidence: "0.91"
  },
  {
    question: "Can I talk to an agent?",
    answer: "The AI explains that the widget is AI-first and can queue the issue for staff review or collect callback details.",
    source: "Callback requests",
    confidence: "0.74"
  }
]

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-slate-950 dark:text-white">Knowledge base</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Approved articles that the AI assistant can cite when answering widget questions.</p>
        </div>
        <button className="focus-ring inline-flex items-center gap-2 rounded bg-sky-600 px-3 py-2 text-sm text-white">
          <FileText size={16} />
          New article
        </button>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Search className="text-sky-600" size={18} />
            <h2 className="font-semibold">AI answer sources</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sources.map(source => (
              <article key={source.title} className="rounded border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-950 dark:text-white">{source.title}</h3>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                    <CheckCircle2 size={13} />
                    {source.status}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase text-slate-400">{source.tags}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{source.excerpt}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="text-sky-600" size={18} />
            <h2 className="font-semibold">Source trace</h2>
          </div>
          <div className="space-y-3">
            {examples.map(example => (
              <article key={example.question} className="rounded border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="font-medium text-slate-950 dark:text-white">{example.question}</p>
                <p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">{example.answer}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-sky-50 px-2 py-1 text-sky-700">Source: {example.source}</span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Confidence: {example.confidence}</span>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
