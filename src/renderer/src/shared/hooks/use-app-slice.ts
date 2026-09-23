import { useCallback, useEffect, useState } from 'react'
import { AppStateChannel, type AppStateChange } from '../../../../shared/app-state/channels'

export function useAppSlice<T>(name: string): {
  value: T | undefined
  patch: (patch: Record<string, unknown>) => void
} {
  const [value, setValue] = useState<T | undefined>(undefined)

  useEffect(() => {
    const onChanged = (_event: Electron.IpcRendererEvent, change: AppStateChange): void => {
      if (change.name === name) setValue(change.value as T)
    }
    window.electron.ipcRenderer.on(AppStateChannel.Changed, onChanged)
    queueMicrotask(() => {
      void window.electron.ipcRenderer
        .invoke(AppStateChannel.Get, name)
        .then((current) => setValue(current as T | undefined))
    })
    return () => {
      window.electron.ipcRenderer.removeListener(AppStateChannel.Changed, onChanged)
    }
  }, [name])

  const patch = useCallback(
    (patchValue: Record<string, unknown>) => {
      void window.electron.ipcRenderer.invoke(AppStateChannel.Patch, name, patchValue)
    },
    [name]
  )

  return { value, patch }
}
