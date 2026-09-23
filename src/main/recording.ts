import { ipcMain } from 'electron'
import { RecordingChannel } from '../shared/recording/channels'
import { RECORDING_SLICE, type RecordingSession } from '../shared/recording/types'
import { defineSlice, getSlice, setSlice } from './app-state'

const INITIAL_SESSION: RecordingSession = {
  state: 'idle',
  startedAt: null,
  pausedAccumMs: 0,
  notes: null,
  lastWriter: null
}

export function initRecordingIpc(): void {
  defineSlice(RECORDING_SLICE, INITIAL_SESSION, { writable: true })

  ipcMain.handle(RecordingChannel.Start, () =>
    setSlice<RecordingSession>(RECORDING_SLICE, (current) => ({
      ...current,
      state: 'recording',
      startedAt: Date.now(),
      pausedAccumMs: 0
    }))
  )

  ipcMain.handle(RecordingChannel.PauseToggle, () =>
    setSlice<RecordingSession>(RECORDING_SLICE, (current) => {
      if (current.state === 'recording' && current.startedAt !== null) {
        return {
          ...current,
          state: 'paused',
          startedAt: null,
          pausedAccumMs: current.pausedAccumMs + (Date.now() - current.startedAt)
        }
      }
      if (current.state === 'paused') {
        return { ...current, state: 'recording', startedAt: Date.now() }
      }
      return current
    })
  )

  ipcMain.handle(RecordingChannel.Stop, () =>
    setSlice<RecordingSession>(RECORDING_SLICE, (current) => ({
      ...current,
      state: 'idle',
      startedAt: null,
      pausedAccumMs: 0
    }))
  )
}

export function getRecordingSession(): RecordingSession {
  return getSlice<RecordingSession>(RECORDING_SLICE)
}
