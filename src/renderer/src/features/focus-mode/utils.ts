import {
  FOCUS_MODE_DURATION_MS,
  type FocusFinishSound,
  type FocusTimerHistoryEntry
} from '../../../../shared/focus-mode/types'

export const FINISH_SOUND_LABELS: Record<FocusFinishSound, string> = {
  chime: 'Chime',
  bell: 'Bell',
  beep: 'Beep',
  none: 'Silent'
}

export function playFinishSound(sound: FocusFinishSound): void {
  if (sound === 'none') return
  try {
    const context = new AudioContext()
    const tone = (
      frequency: number,
      startAt: number,
      duration: number,
      type: OscillatorType = 'sine',
      peak = 0.15
    ): void => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0, startAt)
      gain.gain.linearRampToValueAtTime(peak, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(startAt)
      oscillator.stop(startAt + duration)
    }
    const at = context.currentTime
    if (sound === 'bell') {
      tone(987.77, at, 0.9)
      tone(659.25, at + 0.25, 1.1)
    } else if (sound === 'beep') {
      tone(880, at, 0.12, 'square', 0.08)
      tone(880, at + 0.2, 0.12, 'square', 0.08)
    } else {
      for (const [index, frequency] of [523.25, 659.25, 783.99].entries()) {
        tone(frequency, at + index * 0.12, 0.5)
      }
    }
    window.setTimeout(() => void context.close(), 2000)
  } catch {
    // audio playback not available
  }
}

export const FOCUS_DURATIONS = [
  { label: '5 sec', durationMs: 5 * 1000 },
  { label: '15 min', durationMs: 15 * 60 * 1000 },
  { label: '30 min', durationMs: 30 * 60 * 1000 },
  { label: '45 min', durationMs: 45 * 60 * 1000 },
  { label: '1 hr', durationMs: FOCUS_MODE_DURATION_MS }
]

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${totalSeconds}s`
}

export type HistoryGroup = {
  label: string
  items: FocusTimerHistoryEntry[]
}

export function groupHistoryByDate(entries: FocusTimerHistoryEntry[]): HistoryGroup[] {
  const startOfDay = (timestamp: number): number => {
    const date = new Date(timestamp)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }
  const todayStart = startOfDay(Date.now())
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000

  const groups: HistoryGroup[] = []
  for (const entry of entries) {
    const dayStart = startOfDay(entry.startedAt)
    const label =
      dayStart === todayStart
        ? 'Today'
        : dayStart === yesterdayStart
          ? 'Yesterday'
          : new Date(entry.startedAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(entry)
    } else {
      groups.push({ label, items: [entry] })
    }
  }
  return groups
}
