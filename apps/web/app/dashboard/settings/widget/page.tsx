"use client"

import { Bot, Check, Clipboard, Save, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"

export default function WidgetSettingsPage() {
  const [title, setTitle] = useState("AvivaVirtual AI Agent")
  const [launcherLabel, setLauncherLabel] = useState("AvivaVirtual AI Agent")
  const [orgId, setOrgId] = useState("demo")
  const [language, setLanguage] = useState("en")
  const [apiUrl, setApiUrl] = useState("https://app.avivavirtual.ca")
  const [accent, setAccent] = useState("#0EA5E9")
  const [requireConsent, setRequireConsent] = useState(true)
  const [status, setStatus] = useState("Saved")

  const embedCode = useMemo(() => {
    const consent = requireConsent ? " data-require-consent=\"true\"" : " data-require-consent=\"false\""
    return `<script src="${apiUrl}/widget/widget.js" data-org-id="${orgId}" data-title="${title}" data-lang="${language}" data-api-url="${apiUrl}" data-launcher-label="${launcherLabel}" data-accent="${accent}"${consent}></script>`
  }, [accent, apiUrl, language, launcherLabel, orgId, requireConsent, title])

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(embedCode)
      setStatus("Copied embed")
    } catch {
      setStatus("Copy unavailable")
    }
  }

  function saveSettings() {
    window.localStorage.setItem("aviva_widget_settings", JSON.stringify({ title, launcherLabel, orgId, language, apiUrl, accent, requireConsent }))
    setStatus("Saved")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-slate-950 dark:text-white">Widget settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Configure the customer-facing AI widget and copy the website embed code.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check size={16} />
          {status}
        </span>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <form className="panel grid gap-4 p-5" onSubmit={event => event.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Widget title
              <input className="focus-ring rounded border border-slate-300 px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900" value={title} onChange={event => setTitle(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Launcher label
              <input className="focus-ring rounded border border-slate-300 px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900" value={launcherLabel} onChange={event => setLauncherLabel(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Organization ID
              <input className="focus-ring rounded border border-slate-300 px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900" value={orgId} onChange={event => setOrgId(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Default language
              <select className="focus-ring rounded border border-slate-300 px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900" value={language} onChange={event => setLanguage(event.target.value)}>
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
              API URL
              <input className="focus-ring rounded border border-slate-300 px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900" value={apiUrl} onChange={event => setApiUrl(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Accent color
              <span className="flex gap-2">
                <input className="h-10 w-14 rounded border border-slate-300" type="color" value={accent} onChange={event => setAccent(event.target.value)} />
                <input className="focus-ring min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900" value={accent} onChange={event => setAccent(event.target.value)} />
              </span>
            </label>
            <label className="flex items-center gap-2 self-end rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={requireConsent} onChange={event => setRequireConsent(event.target.checked)} />
              Require PIPEDA consent
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="focus-ring inline-flex items-center gap-2 rounded bg-sky-600 px-3 py-2 text-sm text-white" type="button" onClick={saveSettings}>
              <Save size={16} />
              Save settings
            </button>
            <button className="focus-ring inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200" type="button" onClick={copyEmbed}>
              <Clipboard size={16} />
              Copy embed
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="panel p-5">
            <h2 className="font-semibold">Preview</h2>
            <div className="mt-4 rounded border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                  <span className="relative grid h-12 w-12 place-items-center rounded text-sm font-black text-white shadow-sm" style={{ background: "linear-gradient(135deg,#0f766e,#0ea5e9 58%,#1d4ed8)" }}>
                    AV
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-200 shadow-[0_0_0_3px_rgba(167,243,208,0.35)]" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">Approved-knowledge assistant</p>
                  </div>
                </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: accent }}>
                  <Bot size={16} />
                  {launcherLabel}
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  <Sparkles size={14} />
                  Demo ready
                </span>
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="font-semibold">Embed code</h2>
            <pre className="mt-4 overflow-auto rounded bg-slate-100 p-4 text-xs leading-6 dark:bg-slate-800">{embedCode}</pre>
          </div>
        </aside>
      </section>
    </div>
  )
}
