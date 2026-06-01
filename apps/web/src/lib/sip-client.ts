import JsSIP from 'jssip';

type SipCredentials = { username: string; password: string; displayName: string; server: string };
type SipCallbacks = { onRegistered?: () => void; onUnregistered?: () => void; onIncomingCall?: (session: unknown) => void; onCallEnded?: () => void; onCallFailed?: (cause?: string) => void };

class SipClient {
  private ua?: JsSIP.UA;
  private currentSession?: { terminate: () => void; answer?: (options?: unknown) => void; hold?: () => void; unhold?: () => void; sendDTMF?: (tone: string) => void };
  private callbacks: SipCallbacks = {};

  initialize(credentials: SipCredentials, callbacks: SipCallbacks = {}) {
    this.callbacks = callbacks;
    const socket = new JsSIP.WebSocketInterface(`wss://${credentials.server}:8443`);
    this.ua = new JsSIP.UA({ sockets: [socket], uri: `sip:${credentials.username}@${credentials.server}`, password: credentials.password, display_name: credentials.displayName, register: true });
    this.ua.on('registered', () => this.callbacks.onRegistered?.());
    this.ua.on('unregistered', () => this.callbacks.onUnregistered?.());
    this.ua.on('newRTCSession', (event: { session: typeof this.currentSession; originator: string }) => {
      this.currentSession = event.session;
      if (event.originator === 'remote') this.callbacks.onIncomingCall?.(event.session);
    });
    this.ua.start();
  }

  answerCall() { this.currentSession?.answer?.({ mediaConstraints: { audio: true, video: false } }); }
  rejectCall() { this.currentSession?.terminate(); }
  hangUp() { this.currentSession?.terminate(); }
  hold() { this.currentSession?.hold?.(); }
  unhold() { this.currentSession?.unhold?.(); }
  sendDTMF(tone: string) { this.currentSession?.sendDTMF?.(tone); }

  makeCall(number: string) {
    if (!this.ua) return;
    this.currentSession = this.ua.call(number, { mediaConstraints: { audio: true, video: false } }) as typeof this.currentSession;
  }
}

export const sipClient = new SipClient();
