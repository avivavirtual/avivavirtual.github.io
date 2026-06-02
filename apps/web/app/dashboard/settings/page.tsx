import { Bot, CreditCard, Phone, Settings } from "lucide-react"
import Link from "next/link"

const settings = [
  { href: "/dashboard/settings/widget", title: "Widget settings", text: "AvivaVirtual AI Agent title, launcher label, consent, color, language, and embed code.", icon: Bot },
  { href: "/dashboard/settings/voip", title: "VoIP settings", text: "SIP registration, callback handling, and phone configuration.", icon: Phone },
  { href: "/dashboard/settings/billing", title: "Billing", text: "Plan, included seats, usage, and billing account summary.", icon: CreditCard },
  { href: "/dashboard/settings", title: "Organization", text: "Organization profile, AI confidence, SLA, retention, and language defaults.", icon: Settings }
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-slate-950 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Configuration areas for the customer care workspace.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {settings.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.title} href={item.href} className="panel block p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
              <Icon className="text-sky-600" size={22} />
              <h2 className="mt-4 font-semibold text-slate-950 dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
