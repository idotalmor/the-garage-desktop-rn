/** IPC for app updates: snapshot, check now, reload to the ready bundle, open the .dmg download, ready reports. */
import { BrowserWindow, ipcMain } from 'electron'
import { AppUpdatesChannel } from '../../shared/app-updates/channels'
import { getSnapshot, onRunningChanged, runCheck, startUpdates, subscribe } from './sync'
import { applyReadyBundle, openBaseDownload } from './use-cases'
import { onRendererReady, reloadRendererWindows } from './windows'

/** Call once at startup, before the first window opens. */
export function initAppUpdatesIpc(): void {
  ipcMain.handle(AppUpdatesChannel.GetSnapshot, () => getSnapshot())
  ipcMain.handle(AppUpdatesChannel.Check, () => runCheck().then(getSnapshot))
  ipcMain.handle(AppUpdatesChannel.Reload, () => applyReadyBundle())
  ipcMain.handle(AppUpdatesChannel.OpenBaseDownload, () => openBaseDownload())
  ipcMain.on(AppUpdatesChannel.Ready, (event) => onRendererReady(event.sender))
  subscribe((snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(AppUpdatesChannel.Changed, snapshot)
    }
  })
  onRunningChanged(reloadRendererWindows)
  startUpdates()
}
