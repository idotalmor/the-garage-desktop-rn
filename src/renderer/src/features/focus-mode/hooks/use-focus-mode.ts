import { useCallback, useEffect, useState } from 'react'
import { FocusModeChannel } from '../../../../../shared/focus-mode/channels'
import {
  FOCUS_MODE_SLICE,
  type FocusFinishSound,
  type FocusModeSession,
  type FocusPlanResult,
  type FocusPlanTimer,
  type FocusTimer,
  type FocusTimerHistoryEntry
} from '../../../../../shared/focus-mode/types'
import type { ChatMessage } from '../../../../../shared/integrations/types'
import { useAppSlice } from '../../../shared/hooks/use-app-slice'

export function useFocusMode(): {
  timers: FocusTimer[]
  now: number
  startTimer: (options?: { name?: string | null; durationMs?: number }) => void
  requestStop: (id: string) => void
  setDuration: (id: string, durationMs: number) => void
  renameTimer: (id: string, name: string) => void
  pauseStop: (id: string) => void
  resumeStop: (id: string) => void
  cancelStop: (id: string) => void
  dismissTimer: (id: string) => void
  againTimer: (id: string) => void
  loadHistory: () => Promise<FocusTimerHistoryEntry[]>
  rerunTimer: (entry: FocusTimerHistoryEntry) => void
  getFinishSound: () => Promise<FocusFinishSound>
  setFinishSound: (sound: FocusFinishSound) => void
  planFocus: (messages: ChatMessage[]) => Promise<FocusPlanResult>
  schedulePlan: (timers: FocusPlanTimer[]) => void
} {
  const { value } = useAppSlice<FocusModeSession>(FOCUS_MODE_SLICE)
  const timers = value?.timers ?? []
  const [now, setNow] = useState(() => Date.now())
  const hasActive = timers.some((timer) => timer.state !== 'finished')

  useEffect(() => {
    if (!hasActive) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [hasActive])

  const startTimer = useCallback((options?: { name?: string | null; durationMs?: number }) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.Start, options)
  }, [])
  const requestStop = useCallback((id: string) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.StopRequest, id)
  }, [])
  const setDuration = useCallback((id: string, durationMs: number) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.SetDuration, id, durationMs)
  }, [])
  const renameTimer = useCallback((id: string, name: string) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.Rename, id, name)
  }, [])
  const pauseStop = useCallback((id: string) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.PauseStop, id)
  }, [])
  const resumeStop = useCallback((id: string) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.ResumeStop, id)
  }, [])
  const cancelStop = useCallback((id: string) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.CancelStop, id)
  }, [])
  const dismissTimer = useCallback((id: string) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.Dismiss, id)
  }, [])
  const againTimer = useCallback((id: string) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.Again, id)
  }, [])
  const loadHistory = useCallback(async (): Promise<FocusTimerHistoryEntry[]> => {
    return (await window.electron.ipcRenderer.invoke(
      FocusModeChannel.History
    )) as FocusTimerHistoryEntry[]
  }, [])
  const rerunTimer = useCallback(
    (entry: FocusTimerHistoryEntry) => {
      startTimer({ name: entry.name, durationMs: entry.durationMs })
    },
    [startTimer]
  )
  const getFinishSound = useCallback(async (): Promise<FocusFinishSound> => {
    return (await window.electron.ipcRenderer.invoke(
      FocusModeChannel.GetFinishSound
    )) as FocusFinishSound
  }, [])
  const setFinishSound = useCallback((sound: FocusFinishSound) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.SetFinishSound, sound)
  }, [])
  const planFocus = useCallback(async (messages: ChatMessage[]): Promise<FocusPlanResult> => {
    return (await window.electron.ipcRenderer.invoke(
      FocusModeChannel.Plan,
      messages
    )) as FocusPlanResult
  }, [])
  const schedulePlan = useCallback((timers: FocusPlanTimer[]) => {
    void window.electron.ipcRenderer.invoke(FocusModeChannel.Schedule, timers)
  }, [])

  return {
    timers,
    now,
    startTimer,
    requestStop,
    setDuration,
    renameTimer,
    pauseStop,
    resumeStop,
    cancelStop,
    dismissTimer,
    againTimer,
    loadHistory,
    rerunTimer,
    getFinishSound,
    setFinishSound,
    planFocus,
    schedulePlan
  }
}
