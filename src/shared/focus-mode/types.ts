export type FocusTimerState = 'scheduled' | 'running' | 'stopping' | 'finished'

export type FocusTimer = {
  id: string
  groupId: string | null
  name: string | null
  durationMs: number
  startsAt: number
  startedAt: number
  endsAt: number
  runCount: number
  state: FocusTimerState
  confirmUntil: number | null
}

export type FocusTimerHistoryEntry = {
  id: string
  groupId: string | null
  name: string | null
  durationMs: number
  runCount: number
  startedAt: number
  endedAt: number | null
  totalElapsedMs: number
  state: 'finished' | 'stopped' | 'interrupted'
}

export type FocusPlanTimer = {
  name: string
  durationMs: number
  startsAt: number
}

export type FocusPlanResult = {
  text: string
  plan: FocusPlanTimer[] | null
}

export type FocusModeSession = {
  timers: FocusTimer[]
}

export const FOCUS_MODE_SLICE = 'focus-mode'
export const FOCUS_MODE_DURATION_MS = 60 * 60 * 1000
export const FOCUS_MODE_STOP_GRACE_MS = 5 * 1000

export const FOCUS_FINISH_SOUNDS = ['chime', 'bell', 'beep', 'none'] as const
export type FocusFinishSound = (typeof FOCUS_FINISH_SOUNDS)[number]
export const DEFAULT_FOCUS_FINISH_SOUND: FocusFinishSound = 'chime'

export function isFocusFinishSound(value: unknown): value is FocusFinishSound {
  return typeof value === 'string' && (FOCUS_FINISH_SOUNDS as readonly string[]).includes(value)
}
