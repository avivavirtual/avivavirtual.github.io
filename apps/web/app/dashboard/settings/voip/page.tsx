export default function VoipSettingsPage() {
  return (
    <section className="panel grid max-w-4xl gap-4 p-5">
      <h1 className="font-heading text-2xl font-semibold">VoIP.ms settings</h1>
      <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="VoIP.ms API username" />
      <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="DID number" />
      <select className="focus-ring rounded border border-slate-300 px-3 py-2">
        <option>toronto.voip.ms</option>
        <option>montreal.voip.ms</option>
      </select>
      <button className="focus-ring rounded bg-sky-600 px-4 py-2 text-white">Save</button>
    </section>
  )
}
