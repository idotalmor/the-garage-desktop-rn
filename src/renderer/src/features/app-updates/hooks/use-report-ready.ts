/**
 * Tells main the UI rendered (`AppUpdatesChannel.Ready`). A bundle running for the first time is
 * confirmed by this; without it main falls back to the previous UI. Call once in the root component.
 */
import { useEffect } from 'react'
import { AppUpdatesChannel } from '../../../../../shared/app-updates/channels'

export function useReportReady(): void {
  useEffect(() => {
    window.electron.ipcRenderer.send(AppUpdatesChannel.Ready)
  }, [])
}
