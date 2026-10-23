/**
 * IPC layer for local repos. Each handler forwards one renderer request to `scan-service`, and
 * every snapshot change is pushed to all windows. No state lives here.
 */
import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { LocalReposChannel } from '../../shared/local-repos/channels'
import {
  addScanFolders,
  getSnapshot,
  removeScanFolder,
  rescan,
  startScanService,
  subscribe
} from './scan-service'

export function initLocalReposIpc(): void {
  ipcMain.handle(LocalReposChannel.GetSnapshot, () => getSnapshot())
  ipcMain.handle(LocalReposChannel.AddScanFolders, async (event) =>
    addScanFolders(await pickFolders(event))
  )
  ipcMain.handle(LocalReposChannel.RemoveScanFolder, (_, id: string) =>
    removeScanFolder(String(id))
  )
  ipcMain.handle(LocalReposChannel.Rescan, (_, scanFolderId?: string) =>
    rescan(scanFolderId ? String(scanFolderId) : undefined)
  )

  subscribe((snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(LocalReposChannel.Changed, snapshot)
    }
  })

  startScanService()
}

/** Shows the native folder picker attached to the requesting window. Returns [] if cancelled. */
async function pickFolders(event: IpcMainInvokeEvent): Promise<string[]> {
  const parent = BrowserWindow.fromWebContents(event.sender)
  const options: Electron.OpenDialogOptions = {
    title: 'Choose folders with repositories',
    buttonLabel: 'Scan',
    properties: ['openDirectory', 'multiSelections']
  }
  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)
  return result.canceled ? [] : result.filePaths
}
