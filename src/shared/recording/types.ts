export type RecordingState = 'idle' | 'recording' | 'paused'

export type RecordingSession = {
  state: RecordingState
  startedAt: number | null
  pausedAccumMs: number
  notes: unknown | null
  lastWriter: string | null
}

export const RECORDING_SLICE = 'recording'
