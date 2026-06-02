import { Bot, FileText, Phone, Ticket } from "lucide-react"

const services = [
  { title: "AvivaVirtual AI Agent", text: "Website visitors chat with an approved-knowledge AI agent with confidence scoring and async review routing.", icon: Bot },
  { title: "Ticket operations", text: "Priorities, SLA timers, comments, attachments, and audit history.", icon: Ticket },
  { title: "VoIP.ms calling", text: "Browser SIP registration, callback requests, CDR sync, and call records.", icon: Phone },
  { title: "Whisper summaries", text: "Post-call transcription, summaries, notifications, and retention controls.", icon: FileText }
]

export default function ServicesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">Services</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {services.map(service => {
          const Icon = service.icon
          return (
            <section key={service.title} className="panel p-5">
              <Icon className="text-sky-600" size={24} />
              <h2 className="mt-4 text-lg font-semibold">{service.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{service.text}</p>
            </section>
          )
        })}
      </div>
    </main>
  )
}
