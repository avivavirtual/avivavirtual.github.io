"use client"

import type { RTCSession } from "jssip"
import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { apiFetch } from "@/lib/api"
import { sipClient, type SipCredentials } from "@/lib/sip-client"

interface SipContextValue {
  isRegistered: boolean
  isOnCall: boolean
  currentCall: RTCSession | null
  incomingCall: RTCSession | null
  makeCall: (phoneNumber: string) => void
  answer: () => void
  decline: () => void
  hangUp: () => void
  mute: () => void
  hold: () => void
  remoteStream: MediaStream | null
}

const SipContext = createContext<SipContextValue | null>(null)

export function SipProvider({ children, agentId = "demo-agent" }: { children: ReactNode; agentId?: string }) {
  const [isRegistered, setRegistered] = useState(false)
  const [currentCall, setCurrentCall] = useState<RTCSession | null>(null)
  const [incomingCall, setIncomingCall] = useState<RTCSession | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const token = window.localStorage.getItem("aviva_access_token")
        const creds = token
          ? await apiFetch<SipCredentials>(`/api/v1/voip/credentials/${agentId}`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` }
            })
          : null
        if (!creds || cancelled) return
        sipClient.initialize(creds)
        sipClient.onRegistered(() => setRegistered(true))
        sipClient.onUnregistered(() => setRegistered(false))
        sipClient.onRegistrationFailed(() => setRegistered(false))
        sipClient.onIncomingCall(session => {
          setIncomingCall(session)
          setCurrentCall(session)
          setRemoteStream(sipClient.getRemoteStream())
        })
      } catch {
        setRegistered(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [agentId])

  const makeCall = useCallback((phoneNumber: string) => {
    sipClient.makeCall(phoneNumber)
    setRemoteStream(sipClient.getRemoteStream())
  }, [])

  const answer = useCallback(() => {
    if (!incomingCall) return
    sipClient.answerCall(incomingCall)
    setCurrentCall(incomingCall)
    setIncomingCall(null)
  }, [incomingCall])

  const decline = useCallback(() => {
    if (!incomingCall) return
    sipClient.rejectCall(incomingCall)
    setIncomingCall(null)
  }, [incomingCall])

  const hangUp = useCallback(() => {
    sipClient.hangUp()
    setCurrentCall(null)
    setIncomingCall(null)
  }, [])

  const value = useMemo(
    () => ({
      isRegistered,
      isOnCall: Boolean(currentCall),
      currentCall,
      incomingCall,
      makeCall,
      answer,
      decline,
      hangUp,
      mute: () => sipClient.mute(),
      hold: () => sipClient.hold(),
      remoteStream
    }),
    [answer, currentCall, decline, hangUp, incomingCall, isRegistered, makeCall, remoteStream]
  )

  return <SipContext.Provider value={value}>{children}</SipContext.Provider>
}

export function useSip() {
  const context = useContext(SipContext)
  if (!context) throw new Error("useSip must be used inside SipProvider")
  return context
}
