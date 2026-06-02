"use client"

import { Phone, PhoneOff } from "lucide-react"
import { useEffect } from "react"

import { useSip } from "./SipProvider"

export function IncomingCallToast() {
  const { incomingCall, answer, decline } = useSip()

  useEffect(() => {
    if (!incomingCall) return
    const audio = new AudioContext()
    const oscillator = audio.createOscillator()
    oscillator.frequency.value = 660
    oscillator.connect(audio.destination)
    oscillator.start()
    const stop = window.setTimeout(() => {
      oscillator.stop()
      audio.close()
    }, 300)
    const missed = window.setTimeout(decline, 30000)
    return () => {
      window.clearTimeout(stop)
      window.clearTimeout(missed)
      audio.close().catch(() => undefined)
    }
  }, [decline, incomingCall])

  if (!incomingCall) return null
  return (
    <div className="fixed right-4 top-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-300">Incoming call</p>
      <p className="mt-1 font-semibold">Customer phone call</p>
      <div className="mt-4 flex gap-2">
        <button className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded bg-emerald-600 px-3 py-2 text-sm text-white" onClick={answer}>
          <Phone size={16} />
          Answer
        </button>
        <button className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded bg-rose-600 px-3 py-2 text-sm text-white" onClick={decline}>
          <PhoneOff size={16} />
          Decline
        </button>
      </div>
    </div>
  )
}
