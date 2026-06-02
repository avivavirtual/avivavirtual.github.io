"use client"

import { Phone } from "lucide-react"
import { useState } from "react"

import { useSip } from "./SipProvider"

export function OutboundCallButton({ phoneNumber, customerName }: { phoneNumber: string; customerName: string }) {
  const { makeCall } = useSip()
  const [status, setStatus] = useState<"idle" | "dialing" | "connected" | "failed">("idle")

  function call() {
    try {
      setStatus("dialing")
      makeCall(phoneNumber)
      window.setTimeout(() => setStatus("connected"), 800)
    } catch {
      setStatus("failed")
    }
  }

  return (
    <button className="focus-ring inline-flex items-center gap-2 rounded bg-sky-600 px-3 py-2 text-sm text-white" onClick={call}>
      <Phone size={16} />
      {status === "idle" ? `Call ${customerName}` : status}
    </button>
  )
}
