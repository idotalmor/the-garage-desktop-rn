/** App updates snapshot from main (get once + `Changed` pushes) and the update actions. */
import { useCallback, useEffect, useState } from 'react'
import { AppUpdatesChannel } from '../../../../../shared/app-updates/channels'
import type { AppUpdatesSnapshot } from '../../../../../shared/app-updates/types'

export function useAppUpdates(): {
  snapshot: AppUpdatesSnapshot | null
  reload: () => void
  openBaseDownload: () => void
} {
  const [snapshot, setSnapshot] = useState<AppUpdatesSnapshot | null>(null)

  useEffect(() => {
    const onChanged = (_event: Electron.IpcRendererEvent, next: AppUpdatesSnapshot): void =>
      setSnapshot(next)
    window.electron.ipcRenderer.on(AppUpdatesChannel.Changed, onChanged)
    void window.electron.ipcRenderer
      .invoke(AppUpdatesChannel.GetSnapshot)
      .then((current) => setSnapshot(current as AppUpdatesSnapshot))
    return () => {
      window.electron.ipcRenderer.removeListener(AppUpdatesChannel.Changed, onChanged)
    }
  }, [])

  const reload = useCallback(() => {
    void window.electron.ipcRenderer.invoke(AppUpdatesChannel.Reload)
  }, [])
  const openBaseDownload = useCallback(() => {
    void window.electron.ipcRenderer.invoke(AppUpdatesChannel.OpenBaseDownload)
  }, [])

  return { snapshot, reload, openBaseDownload }
}
