import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { LocalReposChannel } from '../../shared/local-repos/channels'
import type { ScanProgress, LocalReposSnapshot } from '../../shared/local-repos/types'
import {
  addScanFolders,
  listRepositories,
  listScanFolders,
  markScanFolderError,
  removeScanFolder,
  saveScanFolderResult
} from './repository'
import { scanFolder } from './scanner'

const FOCUS_RESCAN_INTERVAL_MS = 5 * 60_000
const PROGRESS_BROADCAST_MS = 250

let pendingScans = 0
let progress: ScanProgress | null = null
let scanQueue: Promise<void> = Promise.resolve()
let lastFullScanAt = 0
let lastProgressBroadcast = 0

function snapshot(): LocalReposSnapshot {
  return {
    scanFolders: listScanFolders(),
    repositories: listRepositories(),
    scanning: pendingScans > 0,
    progress
  }
}

function broadcast(): void {
  const current = snapshot()
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(LocalReposChannel.Changed, current)
  }
}

function broadcastProgress(next: ScanProgress): void {
  progress = next
  const now = Date.now()
  if (now - lastProgressBroadcast < PROGRESS_BROADCAST_MS) return
  lastProgressBroadcast = now
  broadcast()
}

async function runScan(scanFolderIds?: string[]): Promise<void> {
  const scanFolders = listScanFolders().filter(
    (folder) => !scanFolderIds || scanFolderIds.includes(folder.id)
  )
  if (!scanFolderIds) lastFullScanAt = Date.now()
  for (const folder of scanFolders) {
    try {
      const stats = await fs.stat(folder.path)
      if (!stats.isDirectory()) throw new Error('Not a folder')
      const result = await scanFolder(folder.path, folder.id, folder.maxDepth, broadcastProgress)
      saveScanFolderResult(folder.id, result.repositories)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[local-repos] scan failed for', folder.path, message)
      saveScanFolderResult(folder.id, [])
      markScanFolderError(folder.id, message)
    }
    broadcast()
  }
}

function enqueueScan(scanFolderIds?: string[]): void {
  pendingScans++
  broadcast()
  scanQueue = scanQueue
    .then(() => runScan(scanFolderIds))
    .catch((error) => console.error('[local-repos] scan failed', error))
    .finally(() => {
      pendingScans--
      if (pendingScans === 0) progress = null
      broadcast()
    })
}

export function initLocalReposIpc(): void {
  ipcMain.handle(LocalReposChannel.GetSnapshot, () => snapshot())

  ipcMain.handle(LocalReposChannel.AddScanFolders, async (event) => {
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
    const added = addScanFolders(paths)
    if (added.length > 0) enqueueScan(added.map((folder) => folder.id))
    return snapshot()
  })

  ipcMain.handle(LocalReposChannel.RemoveScanFolder, (_, id: string) => {
    removeScanFolder(String(id))
    broadcast()
    return snapshot()
  })

  ipcMain.handle(LocalReposChannel.Rescan, (_, scanFolderId?: string) => {
    enqueueScan(scanFolderId ? [String(scanFolderId)] : undefined)
    return snapshot()
  })

  app.on('browser-window-focus', () => {
    if (pendingScans > 0 || Date.now() - lastFullScanAt < FOCUS_RESCAN_INTERVAL_MS) return
    if (listScanFolders().length > 0) enqueueScan()
  })

  if (listScanFolders().length > 0) enqueueScan()
}
