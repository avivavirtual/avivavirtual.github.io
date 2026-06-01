import type { ReactNode } from 'react';

export function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
    </section>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-slate-50 text-slate-950">{children}</main>;
}
