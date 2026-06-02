"use client"

import { Copy, Download, RotateCcw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api"
import { AiConfidenceBar } from "@/components/ui/AiConfidenceBar"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface TranscriptResponse {
  transcription: string | null
  summary: string | null
  status: "PENDING" | "QUEUED" | "DOWNLOADING" | "TRANSCRIBING" | "SUMMARIZING" | "COMPLETED" | "FAILED" | "SKIPPED"
}

export function CallTranscriptPanel({ callRecordId }: { callRecordId: string }) {
  const query = useQuery({
    queryKey: ["call-transcript", callRecordId],
    queryFn: () => apiFetch<TranscriptResponse>(`/api/v1/voip/call-records/${callRecordId}/transcript`),
    refetchInterval: query => {
      const status = (query.state.data as TranscriptResponse | undefined)?.status
      return status && !["COMPLETED", "FAILED", "SKIPPED"].includes(status) ? 15000 : false
    }
  })

  if (query.isLoading) {
    return (
      <div className="panel flex items-center gap-3 p-4">
        <LoadingSpinner />
        <span>Loading transcript</span>
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="panel p-4">
        <p className="font-medium text-rose-700">Transcript unavailable</p>
        <button className="focus-ring mt-3 inline-flex items-center gap-2 rounded bg-slate-100 px-3 py-2 text-sm" onClick={() => query.refetch()}>
          <RotateCcw size={16} />
          Retry
        </button>
      </div>
    )
  }
  const { status, summary, transcription } = query.data
  const canCopy = Boolean(transcription)
  return (
    <div className="panel p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-300">Transcript status</p>
          <p className="font-semibold">{status}</p>
        </div>
        <span className="rounded bg-sky-50 px-2 py-1 text-xs text-sky-700">EN/FR</span>
      </div>
      <AiConfidenceBar value={status === "COMPLETED" ? 0.94 : 0.42} />
      {summary ? <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-900">{summary}</p> : null}
      <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">{transcription || "Transcript will appear when processing completes."}</pre>
      <div className="mt-3 flex gap-2">
        <button className="focus-ring inline-flex items-center gap-2 rounded bg-slate-100 px-3 py-2 text-sm disabled:opacity-50 dark:bg-slate-700" disabled={!canCopy} onClick={() => transcription && navigator.clipboard.writeText(transcription)}>
          <Copy size={16} />
          Copy
        </button>
        <a className={`focus-ring inline-flex items-center gap-2 rounded px-3 py-2 text-sm ${canCopy ? "bg-slate-100 dark:bg-slate-700" : "pointer-events-none bg-slate-100 opacity-50 dark:bg-slate-700"}`} href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcription || "")}`} download={`call-${callRecordId}.txt`}>
          <Download size={16} />
          Download
        </a>
      </div>
    </div>
  )
}
