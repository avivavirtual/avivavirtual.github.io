export interface DesktopSipState {
  registered: boolean
  server: string
}

export function createInitialSipState(): DesktopSipState {
  return { registered: false, server: "webrtc.voip.ms" }
}
