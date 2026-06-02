import { Bell, Headphones, MessageSquare, Phone, Settings, Ticket, UserRound } from "lucide-react"
import { useMemo, useState } from "react"

import { createInitialSipState } from "./sip-client"

type View = "inbox" | "request" | "tickets" | "customer" | "settings"

const nav: Array<{ id: View; label: string; icon: typeof MessageSquare }> = [
  { id: "inbox", label: "Inbox", icon: Headphones },
  { id: "request", label: "Support request", icon: MessageSquare },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "customer", label: "Customer", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings }
]

export default function App() {
  const [view, setView] = useState<View>("inbox")
  const [status, setStatus] = useState("AVAILABLE")
  const sip = useMemo(() => createInitialSipState(), [])
  return (
    <div className="app">
      <aside>
        <h1>Avivavirtual</h1>
        {nav.map(item => {
          const Icon = item.icon
          return (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">Agent desktop</p>
            <h2>{nav.find(item => item.id === view)?.label}</h2>
          </div>
          <div className="top-actions">
            <span className="badge">{status}</span>
            <span className="badge">{sip.registered ? "SIP registered" : `SIP ${sip.server}`}</span>
            <Bell size={20} />
          </div>
        </header>
        {view === "inbox" ? <AgentInboxScreen /> : null}
        {view === "request" ? <SupportRequestScreen /> : null}
        {view === "tickets" ? <TicketQueueScreen /> : null}
        {view === "customer" ? <CustomerProfileScreen /> : null}
        {view === "settings" ? <SettingsScreen status={status} setStatus={setStatus} /> : null}
      </main>
      <NotificationsPanel />
    </div>
  )
}

function AgentInboxScreen() {
  return (
    <section className="panel list">
      <Row title="Jordan Lee" meta="Billing question - open" />
      <Row title="Camille Roy" meta="French review - waiting" />
      <Row title="Priya Singh" meta="Password reset - AI handled" />
    </section>
  )
}

function SupportRequestScreen() {
  return (
    <section className="workspace">
      <div className="panel chat">
        <div className="bubble">Customer: Can I get a callback?</div>
        <div className="bubble agent">Support: I can add that callback window to the ticket.</div>
        <textarea placeholder="Reply" />
      </div>
      <aside className="panel">
        <h3>AI suggestion</h3>
        <p>Offer two callback windows, confirm phone number, and summarize the request in the linked ticket.</p>
      </aside>
    </section>
  )
}

function TicketQueueScreen() {
  return (
    <section className="panel list">
      <Row title="TKT-202606-0001" meta="HIGH - Billing question - 2h SLA" />
      <Row title="TKT-202606-0002" meta="MEDIUM - Callback request - 6h SLA" />
      <Row title="TKT-202606-0003" meta="URGENT - Password reset - 42m SLA" />
    </section>
  )
}

function CustomerProfileScreen() {
  return (
    <section className="panel">
      <h3>Jordan Lee</h3>
      <p>jordan@example.ca - +1 416 555 0111</p>
      <button className="primary"><Phone size={16} /> Start call</button>
    </section>
  )
}

function SettingsScreen({ status, setStatus }: { status: string; setStatus: (value: string) => void }) {
  return (
    <section className="panel form">
      <h3>Status</h3>
      <select value={status} onChange={event => setStatus(event.target.value)}>
        <option>AVAILABLE</option>
        <option>BUSY</option>
        <option>AWAY</option>
        <option>OFFLINE</option>
      </select>
      <button className="primary">Re-register SIP</button>
    </section>
  )
}

function NotificationsPanel() {
  return (
    <div className="notifications">
      <strong>Notifications</strong>
      <p>Transcript ready for recent call.</p>
    </div>
  )
}

function Row({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="row">
      <strong>{title}</strong>
      <span>{meta}</span>
    </div>
  )
}
