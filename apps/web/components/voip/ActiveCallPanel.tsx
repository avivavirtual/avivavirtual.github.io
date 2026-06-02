"use client"

import { Hash, Mic, Pause, PhoneOff, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useSip } from "./SipProvider"

export function ActiveCallPanel() {
  const { isOnCall, hangUp, mute, hold, remoteStream } = useSip()
  const [seconds, setSeconds] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!isOnCall) {
      setSeconds(0)
      return
    }
    const interval = window.setInterval(() => setSeconds(value => value + 1), 1000)
    return () => window.clearInterval(interval)
  }, [isOnCall])

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  if (!isOnCall) return null
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0")
  const ss = (seconds % 60).toString().padStart(2, "0")
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 rounded border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <audio ref={audioRef} autoPlay />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Active call</p>
          <p className="text-xs text-slate-500 dark:text-slate-300">{mm}:{ss}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="focus-ring rounded bg-slate-100 p-2 text-slate-700 dark:bg-slate-700 dark:text-white" onClick={mute} aria-label="Mute">
            <Mic size={18} />
          </button>
          <button className="focus-ring rounded bg-slate-100 p-2 text-slate-700 dark:bg-slate-700 dark:text-white" onClick={hold} aria-label="Hold">
            <Pause size={18} />
          </button>
          <button className="focus-ring rounded bg-slate-100 p-2 text-slate-700 dark:bg-slate-700 dark:text-white" aria-label="Dialpad">
            <Hash size={18} />
          </button>
          <button className="focus-ring rounded bg-slate-100 p-2 text-slate-700 dark:bg-slate-700 dark:text-white" aria-label="Transfer">
            <Send size={18} />
          </button>
          <button className="focus-ring rounded bg-rose-600 p-2 text-white" onClick={hangUp} aria-label="Hang up">
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
