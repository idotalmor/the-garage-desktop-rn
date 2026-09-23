import { useCallback, useEffect, useState } from 'react'
import { RecordingChannel } from '../../../../shared/recording/channels'
import { RECORDING_SLICE, type RecordingSession } from '../../../../shared/recording/types'
import { useAppSlice } from './use-app-slice'

const IDLE_SESSION: RecordingSession = {
  state: 'idle',
  startedAt: null,
  pausedAccumMs: 0,
  notes: null,
  lastWriter: null
}

export function useRecordingStatus(): {
  status: RecordingSession
  elapsedSeconds: number
  start: () => void
  togglePause: () => void
  stop: () => void
  patchSession: (patch: Record<string, unknown>) => void
} {
  const { value, patch } = useAppSlice<RecordingSession>(RECORDING_SLICE)
  const status = value ?? IDLE_SESSION
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (status.state !== 'recording') return
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(timer)
  }, [status.state])

  const elapsedMs =
    status.pausedAccumMs +
    (status.state === 'recording' && status.startedAt !== null ? now - status.startedAt : 0)

  const start = useCallback(() => {
    void window.electron.ipcRenderer.invoke(RecordingChannel.Start)
  }, [])
  const togglePause = useCallback(() => {
    void window.electron.ipcRenderer.invoke(RecordingChannel.PauseToggle)
  }, [])
  const stop = useCallback(() => {
    void window.electron.ipcRenderer.invoke(RecordingChannel.Stop)
  }, [])

  return {
    status,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    start,
    togglePause,
    stop,
    patchSession: patch
  }
}
