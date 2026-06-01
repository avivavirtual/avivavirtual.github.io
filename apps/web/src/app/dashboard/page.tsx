import { MetricCard } from '@avivavirtual/ui';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Cross-tenant operations</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">AvivaVirtual Control Plane</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Live contacts" value="128" detail="Voice, chat, and email across tenants" />
          <MetricCard label="AI containment" value="74%" detail="Resolved without human escalation" />
          <MetricCard label="SLA compliance" value="96%" detail="Active ticket targets met" />
          <MetricCard label="Agents online" value="32" detail="Assigned across client queues" />
        </div>
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Live queue model</h2>
          <p className="mt-2 text-slate-600">Each tenant has isolated knowledge, AI persona, inbound DIDs/widgets, agent assignments, SLA rules, analytics, and branding.</p>
        </section>
      </div>
    </main>
  );
}
