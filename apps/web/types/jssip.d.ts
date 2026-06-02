declare module "jssip" {
  export class WebSocketInterface {
    constructor(url: string)
  }

  export interface RTCSession {
    answer(options: { mediaConstraints: { audio: boolean; video: boolean } }): void
    terminate(): void
    hold(): void
    unhold(): void
    refer(target: string): void
    on(event: "peerconnection" | "confirmed" | "ended" | "failed", callback: (event: unknown) => void): void
  }

  export interface UAOptions {
    sockets: WebSocketInterface[]
    uri: string
    password: string
    display_name: string
    register: boolean
    session_timers: boolean
  }

  export class UA {
    constructor(options: UAOptions)
    start(): void
    on(event: string, callback: (event: unknown) => void): void
    call(target: string, options: { mediaConstraints: { audio: boolean; video: boolean }; pcConfig: RTCConfiguration }): RTCSession
  }

  const JsSIP: {
    WebSocketInterface: typeof WebSocketInterface
    UA: typeof UA
  }
  export default JsSIP
}
