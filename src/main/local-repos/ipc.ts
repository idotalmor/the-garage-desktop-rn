/**
 * IPC layer for local repos. Each handler calls one use case (or `getSnapshot`), and every
 * snapshot change from `sync/` is pushed to all windows. No state lives here.
 */
import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { CommitCursor } from '../../shared/git/types'
import { LocalReposChannel } from '../../shared/local-repos/channels'
import { getSnapshot, startSync, subscribe } from './sync'
import {
  addSources,
  deleteWorktree,
  listCommits,
  openFolder,
  openIde,
  pullWorktree,
  removeSource,
  rescan,
  resetLocalData,
  setRepoOrder
} from './use-cases'

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
  ipcMain.handle(LocalReposChannel.OpenIde, (_, ide: string, path: string) =>
    openIde(String(ide), String(path))
  )
  ipcMain.handle(LocalReposChannel.OpenFolder, (_, path: string) => openFolder(String(path)))
  ipcMain.handle(LocalReposChannel.DeleteWorktree, (_, path: string, remote: boolean) =>
    deleteWorktree(String(path), Boolean(remote))
  )
  ipcMain.handle(LocalReposChannel.Pull, (_, path: string) => pullWorktree(String(path)))
  ipcMain.handle(
    LocalReposChannel.ListCommits,
    (_, repoId: string, worktreePath: unknown, cursor: unknown) =>
      listCommits(
        String(repoId),
        typeof worktreePath === 'string' ? worktreePath : null,
        toCursor(cursor)
      )
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

/** Accepts a `{ head, base, skip }` cursor from the renderer; anything else means "first page". */
function toCursor(value: unknown): CommitCursor | null {
  if (!value || typeof value !== 'object') return null
  const { head, base, skip } = value as Partial<CommitCursor>
  if (!isSha(head)) return null
  if (base !== null && base !== undefined && !isSha(base)) return null
  const count = Number(skip)
  return Number.isInteger(count) && count >= 0 ? { head, base: base ?? null, skip: count } : null
}

function isSha(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{7,64}$/i.test(value)
}
