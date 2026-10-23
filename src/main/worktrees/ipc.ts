import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { WorktreesChannel } from '../../shared/worktrees/channels'
import type { ScanProgress, WorktreesSnapshot } from '../../shared/worktrees/types'
import {
  addRoots,
  listRepositories,
  listRoots,
  markRootError,
  removeRoot,
  saveRootScan
} from './repository'
import { scanRoot } from './scanner'

const FOCUS_RESCAN_INTERVAL_MS = 5 * 60_000
const PROGRESS_BROADCAST_MS = 250

let pendingScans = 0
let progress: ScanProgress | null = null
let scanQueue: Promise<void> = Promise.resolve()
let lastFullScanAt = 0
let lastProgressBroadcast = 0

function snapshot(): WorktreesSnapshot {
  return {
    roots: listRoots(),
    repositories: listRepositories(),
    scanning: pendingScans > 0,
    progress
  }
}

function broadcast(): void {
  const current = snapshot()
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(WorktreesChannel.Changed, current)
  }
}

function broadcastProgress(next: ScanProgress): void {
  progress = next
  const now = Date.now()
  if (now - lastProgressBroadcast < PROGRESS_BROADCAST_MS) return
  lastProgressBroadcast = now
  broadcast()
}

async function runScan(rootIds?: string[]): Promise<void> {
  const roots = listRoots().filter((root) => !rootIds || rootIds.includes(root.id))
  if (!rootIds) lastFullScanAt = Date.now()
  for (const root of roots) {
    try {
      const stats = await fs.stat(root.path)
      if (!stats.isDirectory()) throw new Error('Not a folder')
      const result = await scanRoot(root.path, root.id, root.maxDepth, broadcastProgress)
      saveRootScan(root.id, result.repositories)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[worktrees] scan failed for', root.path, message)
      saveRootScan(root.id, [])
      markRootError(root.id, message)
    }
    broadcast()
  }
}

function enqueueScan(rootIds?: string[]): void {
  pendingScans++
  broadcast()
  scanQueue = scanQueue
    .then(() => runScan(rootIds))
    .catch((error) => console.error('[worktrees] scan failed', error))
    .finally(() => {
      pendingScans--
      if (pendingScans === 0) progress = null
      broadcast()
    })
}

export function initWorktreesIpc(): void {
  ipcMain.handle(WorktreesChannel.GetSnapshot, () => snapshot())

  ipcMain.handle(WorktreesChannel.AddRoots, async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Choose folders with repositories',
      buttonLabel: 'Scan',
      properties: ['openDirectory', 'multiSelections']
    }
    const result = parent
      ? await dialog.showOpenDialog(parent, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return snapshot()

    const paths = await Promise.all(
      result.filePaths.map((path) => fs.realpath(path).catch(() => path))
    )
    const added = addRoots(paths)
    if (added.length > 0) enqueueScan(added.map((root) => root.id))
    return snapshot()
  })

  ipcMain.handle(WorktreesChannel.RemoveRoot, (_, id: string) => {
    removeRoot(String(id))
    broadcast()
    return snapshot()
  })

  ipcMain.handle(WorktreesChannel.Rescan, (_, rootId?: string) => {
    enqueueScan(rootId ? [String(rootId)] : undefined)
    return snapshot()
  })

  app.on('browser-window-focus', () => {
    if (pendingScans > 0 || Date.now() - lastFullScanAt < FOCUS_RESCAN_INTERVAL_MS) return
    if (listRoots().length > 0) enqueueScan()
  })

  if (listRoots().length > 0) enqueueScan()
}
