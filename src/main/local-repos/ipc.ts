/**
 * IPC layer for local repos. Each handler calls one use case (or `getSnapshot`), and every
 * snapshot change from `sync/` is pushed to all windows. No state lives here.
 */
import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { LocalReposChannel } from '../../shared/local-repos/channels'
import { getSnapshot, startSync, subscribe } from './sync'
import { addSources, removeSource, rescan, resetLocalData, setRepoOrder } from './use-cases'

export function initLocalReposIpc(): void {
  ipcMain.handle(LocalReposChannel.GetSnapshot, () => getSnapshot())
  ipcMain.handle(LocalReposChannel.AddSources, async (event) =>
    addSources(await pickFolders(event))
  )
  ipcMain.handle(LocalReposChannel.RemoveSource, (_, id: string) => removeSource(String(id)))
  ipcMain.handle(LocalReposChannel.Rescan, (_, sourceId?: string) =>
    rescan(sourceId ? String(sourceId) : undefined)
  )

  ipcMain.handle(LocalReposChannel.Reset, () => resetLocalData())
  ipcMain.handle(LocalReposChannel.SetOrder, (_, ids: unknown) =>
    setRepoOrder(Array.isArray(ids) ? ids.map(String) : [])
  )

  subscribe((snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(LocalReposChannel.Changed, snapshot)
    }
  })

  startSync()
}

/** Shows the native folder picker attached to the requesting window. Returns [] if cancelled. */
async function pickFolders(event: IpcMainInvokeEvent): Promise<string[]> {
  const parent = BrowserWindow.fromWebContents(event.sender)
  const options: Electron.OpenDialogOptions = {
    title: 'Choose folders with repos',
    buttonLabel: 'Scan',
    properties: ['openDirectory', 'multiSelections']
  }
  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)
  return result.canceled ? [] : result.filePaths
}
