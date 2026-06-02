import JsSIP, { type RTCSession, type UA } from "jssip"

export interface SipCredentials {
  username: string
  password: string
  displayName: string
  server: string
}

type SessionEvent = { session?: RTCSession; originator?: string }
type PeerEvent = { peerconnection?: RTCPeerConnection }

function isSessionEvent(value: unknown): value is SessionEvent {
  return typeof value === "object" && value !== null && "session" in value
}

function isPeerEvent(value: unknown): value is PeerEvent {
  return typeof value === "object" && value !== null && "peerconnection" in value
}

class SipClient {
  private ua: UA | null = null
  private currentSession: RTCSession | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null

  initialize(creds: SipCredentials): void {
    const socket = new JsSIP.WebSocketInterface(`wss://${creds.server}:8443`)
    this.ua = new JsSIP.UA({
      sockets: [socket],
      uri: `sip:${creds.username}@voip.ms`,
      password: creds.password,
      display_name: creds.displayName,
      register: true,
      session_timers: false
    })
    this.ua.start()
  }

  onRegistered(callback: () => void): void {
    this.ua?.on("registered", callback)
  }

  onUnregistered(callback: () => void): void {
    this.ua?.on("unregistered", callback)
  }

  onRegistrationFailed(callback: (event: unknown) => void): void {
    this.ua?.on("registrationFailed", callback)
  }

  onIncomingCall(callback: (session: RTCSession) => void): void {
    this.ua?.on("newRTCSession", (event: unknown) => {
      if (!isSessionEvent(event) || !event.session || event.originator !== "remote") return
      this.currentSession = event.session
      this.attachStreamHandlers(event.session)
      callback(event.session)
    })
  }

  answerCall(session: RTCSession): void {
    session.answer({ mediaConstraints: { audio: true, video: false } })
  }

  rejectCall(session: RTCSession): void {
    session.terminate()
  }

  makeCall(number: string): void {
    if (!this.ua) return
    const session = this.ua.call(`sip:+1${number}@voip.ms`, {
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers: [{ urls: "stun:stun.voip.ms:3478" }] }
    })
    this.currentSession = session
    this.attachStreamHandlers(session)
  }

  hangUp(): void {
    this.currentSession?.terminate()
  }

  mute(): void {
    this.localStream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled
    })
  }

  hold(): void {
    this.currentSession?.hold()
  }

  unhold(): void {
    this.currentSession?.unhold()
  }

  transferTo(number: string): void {
    this.currentSession?.refer(`sip:+1${number}@voip.ms`)
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  private attachStreamHandlers(session: RTCSession): void {
    session.on("peerconnection", (event: unknown) => {
      if (!isPeerEvent(event) || !event.peerconnection) return
      event.peerconnection.addEventListener("track", trackEvent => {
        if (trackEvent.streams[0]) this.remoteStream = trackEvent.streams[0]
      })
    })
    session.on("confirmed", () => {
      const remote = this.remoteStream
      if (remote) this.localStream = new MediaStream(remote.getAudioTracks())
    })
    session.on("ended", () => {
      this.currentSession = null
    })
    session.on("failed", () => {
      this.currentSession = null
    })
  }
}

export const sipClient = new SipClient()
