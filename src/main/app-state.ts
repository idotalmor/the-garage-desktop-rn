import { BrowserWindow, ipcMain } from 'electron'
import { AppStateChannel, type AppStateChange } from '../shared/app-state/channels'

const slices = new Map<string, unknown>()
const rendererWritable = new Set<string>()

export function defineSlice(
  name: string,
  initial: unknown,
  options?: { writable?: boolean }
): void {
  if (!slices.has(name)) slices.set(name, initial)
  if (options?.writable) rendererWritable.add(name)
}

export function getSlice<T>(name: string): T {
  return slices.get(name) as T
}

export function setSlice<T>(name: string, updater: Partial<T> | ((current: T) => T)): T {
  const current = slices.get(name) as T | undefined
  const next =
    typeof updater === 'function'
      ? (updater as (current: T | undefined) => T)(current)
      : { ...(current as Record<string, unknown>), ...(updater as Record<string, unknown>) }
  slices.set(name, next)
  const change: AppStateChange = { name, value: next }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(AppStateChannel.Changed, change)
  }
  return next as T
}

export function initAppStateIpc(): void {
  ipcMain.handle(AppStateChannel.Get, (_, name: string) => slices.get(String(name)))

  ipcMain.handle(AppStateChannel.Patch, (_, name: string, patch: Record<string, unknown>) => {
    const sliceName = String(name)
    if (!rendererWritable.has(sliceName)) return slices.get(sliceName)
    return setSlice(sliceName, (current: Record<string, unknown> | undefined) => ({
      ...(current ?? {}),
      ...(patch ?? {})
    }))
  })
}
