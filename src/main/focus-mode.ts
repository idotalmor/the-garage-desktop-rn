import { ipcMain } from 'electron'
import { FocusModeChannel } from '../shared/focus-mode/channels'
import {
  DEFAULT_FOCUS_FINISH_SOUND,
  FOCUS_MODE_DURATION_MS,
  FOCUS_MODE_SLICE,
  FOCUS_MODE_STOP_GRACE_MS,
  isFocusFinishSound,
  type FocusModeSession,
  type FocusTimer
} from '../shared/focus-mode/types'
import { defineSlice, getSlice, setSlice } from './app-state'
import { getFocusFinishSound, setFocusFinishSound } from './integrations/store'
import {
  beginRun,
  endRun,
  insertScheduledRecord,
  insertTimerRecord,
  listScheduledTimers,
  listTimerHistory,
  markInterruptedRuns,
  renameTimerRecord
} from './focus-timer-repository'
import { planFocusSession } from './focus-planner'
import type { ChatMessage } from '../shared/integrations/types'

const INITIAL_SESSION: FocusModeSession = { timers: [] }

type TimerHandles = {
  start?: ReturnType<typeof setTimeout>
  end?: ReturnType<typeof setTimeout>
  confirm?: ReturnType<typeof setTimeout>
}

const timerHandles = new Map<string, TimerHandles>()

function getTimers(): FocusTimer[] {
  return getSlice<FocusModeSession>(FOCUS_MODE_SLICE).timers
}

function findTimer(id: string): FocusTimer | undefined {
  return getTimers().find((timer) => timer.id === id)
}

function patchTimer(id: string, updater: (timer: FocusTimer) => FocusTimer): void {
  setSlice<FocusModeSession>(FOCUS_MODE_SLICE, (session) => ({
    timers: session.timers.map((timer) => (timer.id === id ? updater(timer) : timer))
  }))
}

function removeTimer(id: string): void {
  const handles = timerHandles.get(id)
  if (handles?.start) clearTimeout(handles.start)
  if (handles?.end) clearTimeout(handles.end)
  if (handles?.confirm) clearTimeout(handles.confirm)
  timerHandles.delete(id)
  setSlice<FocusModeSession>(FOCUS_MODE_SLICE, (session) => ({
    timers: session.timers.filter((timer) => timer.id !== id)
  }))
}

function clearConfirm(id: string): void {
  const handles = timerHandles.get(id)
  if (handles?.confirm) {
    clearTimeout(handles.confirm)
    handles.confirm = undefined
  }
}

function fireScheduled(id: string): void {
  const timer = findTimer(id)
  if (!timer || timer.state !== 'scheduled') return
  const startedAt = Date.now()
  const endsAt = startedAt + timer.durationMs
  patchTimer(id, (current) => ({
    ...current,
    state: 'running',
    startedAt,
    endsAt,
    confirmUntil: null
  }))
  beginRun(id, timer.durationMs, startedAt)
  scheduleEnd(id, endsAt)
}

function scheduleStart(id: string, startsAt: number): void {
  const handles = timerHandles.get(id) ?? {}
  if (handles.start) clearTimeout(handles.start)
  handles.start = setTimeout(
    () => {
      handles.start = undefined
      fireScheduled(id)
    },
    Math.max(0, startsAt - Date.now())
  )
  timerHandles.set(id, handles)
}

function addTimer(input: {
  name: string | null
  durationMs: number
  startsAt: number
  groupId: string | null
}): void {
  const id = crypto.randomUUID()
  const isScheduled = input.startsAt > Date.now()
  const timer: FocusTimer = {
    id,
    groupId: input.groupId,
    name: input.name ?? 'Unknown timer',
    durationMs: input.durationMs,
    startsAt: input.startsAt,
    startedAt: input.startsAt,
    endsAt: input.startsAt + input.durationMs,
    runCount: isScheduled ? 0 : 1,
    state: isScheduled ? 'scheduled' : 'running',
    confirmUntil: null
  }
  setSlice<FocusModeSession>(FOCUS_MODE_SLICE, (session) => ({
    timers: [...session.timers, timer]
  }))
  if (isScheduled) {
    insertScheduledRecord({
      id,
      groupId: input.groupId,
      name: input.name,
      durationMs: input.durationMs,
      startsAt: input.startsAt
    })
    scheduleStart(id, input.startsAt)
  } else {
    insertTimerRecord({
      id,
      groupId: input.groupId,
      name: input.name,
      durationMs: input.durationMs,
      startedAt: timer.startedAt
    })
    scheduleEnd(id, timer.endsAt)
  }
}

function scheduleConfirmRevert(id: string): void {
  const handles = timerHandles.get(id) ?? {}
  if (handles.confirm) clearTimeout(handles.confirm)
  handles.confirm = setTimeout(() => {
    handles.confirm = undefined
    patchTimer(id, (current) =>
      current.state === 'stopping' ? { ...current, state: 'running', confirmUntil: null } : current
    )
  }, FOCUS_MODE_STOP_GRACE_MS)
  timerHandles.set(id, handles)
}

function scheduleEnd(id: string, endsAt: number): void {
  const handles = timerHandles.get(id) ?? {}
  if (handles.end) clearTimeout(handles.end)
  handles.end = setTimeout(
    () => {
      handles.end = undefined
      clearConfirm(id)
      const timer = findTimer(id)
      patchTimer(id, (current) =>
        current.state === 'finished'
          ? current
          : { ...current, state: 'finished', confirmUntil: null }
      )
      if (timer && timer.state !== 'finished') {
        endRun(id, 'finished', timer.endsAt, timer.endsAt - timer.startedAt)
      }
    },
    Math.max(0, endsAt - Date.now())
  )
  timerHandles.set(id, handles)
}

function runTimer(id: string, durationMs: number): void {
  const startedAt = Date.now()
  const endsAt = startedAt + durationMs
  const current = findTimer(id)
  if (current) {
    endRun(id, 'stopped', startedAt, startedAt - current.startedAt)
  }
  patchTimer(id, (timer) => ({
    ...timer,
    state: 'running',
    durationMs,
    startedAt,
    endsAt,
    runCount: timer.runCount + 1,
    confirmUntil: null
  }))
  beginRun(id, durationMs, startedAt)
  scheduleEnd(id, endsAt)
}

export function initFocusModeIpc(): void {
  defineSlice(FOCUS_MODE_SLICE, INITIAL_SESSION)
  markInterruptedRuns()

  for (const row of listScheduledTimers()) {
    const timer: FocusTimer = {
      id: row.id,
      groupId: row.groupId,
      name: row.name,
      durationMs: row.durationMs,
      startsAt: row.startedAt,
      startedAt: row.startedAt,
      endsAt: row.startedAt + row.durationMs,
      runCount: 0,
      state: 'scheduled',
      confirmUntil: null
    }
    setSlice<FocusModeSession>(FOCUS_MODE_SLICE, (session) => ({
      timers: [...session.timers, timer]
    }))
    scheduleStart(row.id, row.startedAt)
  }

  ipcMain.handle(
    FocusModeChannel.Start,
    (_, options?: { name?: unknown; durationMs?: unknown; startsAt?: unknown }) => {
      const duration = Number(options?.durationMs)
      const durationMs =
        Number.isFinite(duration) && duration > 0 ? duration : FOCUS_MODE_DURATION_MS
      const trimmed = typeof options?.name === 'string' ? options.name.trim() : ''
      const start = Number(options?.startsAt)
      const startsAt = Number.isFinite(start) && start > Date.now() + 500 ? start : Date.now()
      addTimer({ name: trimmed || null, durationMs, startsAt, groupId: null })
    }
  )

  ipcMain.handle(FocusModeChannel.Schedule, (_, items: unknown) => {
    if (!Array.isArray(items) || items.length === 0) return null
    const groupId = crypto.randomUUID()
    for (const item of items.slice(0, 20)) {
      const entry = item as { name?: unknown; durationMs?: unknown; startsAt?: unknown }
      const duration = Number(entry.durationMs)
      const startsAt = Number(entry.startsAt)
      if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(startsAt)) continue
      const name = typeof entry.name === 'string' ? entry.name.trim() : ''
      addTimer({ name: name || null, durationMs: duration, startsAt, groupId })
    }
    return groupId
  })

  ipcMain.handle(FocusModeChannel.Plan, (_, messages: unknown) => {
    const list = Array.isArray(messages) ? (messages as ChatMessage[]) : []
    return planFocusSession(list)
  })

  ipcMain.handle(FocusModeChannel.StopRequest, (_, id: string) => {
    const timer = findTimer(id)
    if (!timer) return

    if (timer.state === 'stopping') {
      endRun(id, 'stopped', Date.now(), Date.now() - timer.startedAt)
      removeTimer(id)
      return
    }
    if (timer.state !== 'running') return

    patchTimer(id, (current) => ({
      ...current,
      state: 'stopping',
      confirmUntil: Date.now() + FOCUS_MODE_STOP_GRACE_MS
    }))
    scheduleConfirmRevert(id)
  })

  ipcMain.handle(FocusModeChannel.GetFinishSound, () => {
    const sound = getFocusFinishSound()
    return isFocusFinishSound(sound) ? sound : DEFAULT_FOCUS_FINISH_SOUND
  })

  ipcMain.handle(FocusModeChannel.SetFinishSound, (_, sound: unknown) => {
    if (!isFocusFinishSound(sound)) return
    setFocusFinishSound(sound)
  })

  ipcMain.handle(FocusModeChannel.SetDuration, (_, id: string, durationMs: unknown) => {
    const duration = Number(durationMs)
    if (!findTimer(id) || !Number.isFinite(duration) || duration <= 0) return
    clearConfirm(id)
    runTimer(id, duration)
  })

  ipcMain.handle(FocusModeChannel.Rename, (_, id: string, name: unknown) => {
    const trimmed = typeof name === 'string' ? name.trim() : ''
    const next = trimmed || null
    patchTimer(id, (timer) => ({ ...timer, name: next }))
    renameTimerRecord(id, next)
  })

  ipcMain.handle(FocusModeChannel.PauseStop, (_, id: string) => {
    const timer = findTimer(id)
    if (!timer || timer.state !== 'stopping') return
    clearConfirm(id)
    patchTimer(id, (current) => ({ ...current, confirmUntil: null }))
  })

  ipcMain.handle(FocusModeChannel.ResumeStop, (_, id: string) => {
    const timer = findTimer(id)
    if (!timer || timer.state !== 'stopping') return
    patchTimer(id, (current) => ({
      ...current,
      confirmUntil: Date.now() + FOCUS_MODE_STOP_GRACE_MS
    }))
    scheduleConfirmRevert(id)
  })

  ipcMain.handle(FocusModeChannel.CancelStop, (_, id: string) => {
    const timer = findTimer(id)
    if (!timer || timer.state !== 'stopping') return
    clearConfirm(id)
    patchTimer(id, (current) => ({ ...current, state: 'running', confirmUntil: null }))
  })

  ipcMain.handle(FocusModeChannel.Dismiss, (_, id: string) => {
    const timer = findTimer(id)
    if (timer && timer.state !== 'finished') {
      endRun(id, 'stopped', Date.now(), Date.now() - timer.startedAt)
    }
    removeTimer(id)
  })

  ipcMain.handle(FocusModeChannel.History, () => listTimerHistory())

  ipcMain.handle(FocusModeChannel.Again, (_, id: string) => {
    const timer = findTimer(id)
    if (!timer) return
    clearConfirm(id)
    runTimer(id, timer.durationMs)
  })
}
