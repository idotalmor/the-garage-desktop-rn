/**
 * Scan service: owns the scan queue and the live scan state for local repos.
 *
 * - Runs scans one at a time: on startup, after folders are added, on manual rescan, and when a
 *   window gets focus (at most every 5 minutes).
 * - Saves results through `db/repository` and notifies subscribers with a fresh snapshot.
 *
 * It knows nothing about IPC or windows; `ipc.ts` subscribes and forwards snapshots to the UI.
 */
import { app } from 'electron'
import { promises as fs } from 'fs'
import type { LocalReposSnapshot, ScanProgress } from '../../shared/local-repos/types'
import * as db from './db'
import { scanFolder } from './scanner/scan-folder'

const FOCUS_RESCAN_INTERVAL_MS = 5 * 60_000
const PROGRESS_NOTIFY_INTERVAL_MS = 250

type Listener = (snapshot: LocalReposSnapshot) => void

const listeners = new Set<Listener>()
let pendingScans = 0
let progress: ScanProgress | null = null
let scanQueue: Promise<void> = Promise.resolve()
let lastFullScanAt = 0
let lastProgressNotifyAt = 0

/** Current scan folders, repos and scan state. */
export function getSnapshot(): LocalReposSnapshot {
  return {
    scanFolders: db.listScanFolders(),
    repositories: db.listRepositories(),
    scanning: pendingScans > 0,
    progress
  }
}

/** Calls `listener` with a new snapshot whenever anything changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Saves the folders (resolving symlinks) and scans the ones that are new. */
export async function addScanFolders(paths: string[]): Promise<LocalReposSnapshot> {
  if (paths.length === 0) return getSnapshot()
  const realPaths = await Promise.all(paths.map((path) => fs.realpath(path).catch(() => path)))
  const added = db.addScanFolders(realPaths)
  if (added.length > 0) enqueueScan(added.map((folder) => folder.id))
  return getSnapshot()
}

export function removeScanFolder(id: string): LocalReposSnapshot {
  db.removeScanFolder(id)
  notify()
  return getSnapshot()
}

/** Rescans one scan folder, or all of them when no id is given. */
export function rescan(scanFolderId?: string): LocalReposSnapshot {
  enqueueScan(scanFolderId ? [scanFolderId] : undefined)
  return getSnapshot()
}

/** Starts the initial scan and the rescan-on-focus behavior. Call once at app startup. */
export function startScanService(): void {
  app.on('browser-window-focus', rescanIfStale)
  if (db.listScanFolders().length > 0) enqueueScan()
}

function rescanIfStale(): void {
  if (pendingScans > 0 || Date.now() - lastFullScanAt < FOCUS_RESCAN_INTERVAL_MS) return
  if (db.listScanFolders().length > 0) enqueueScan()
}

function notify(): void {
  const snapshot = getSnapshot()
  for (const listener of listeners) listener(snapshot)
}

function onProgress(next: ScanProgress): void {
  progress = next
  const now = Date.now()
  if (now - lastProgressNotifyAt < PROGRESS_NOTIFY_INTERVAL_MS) return
  lastProgressNotifyAt = now
  notify()
}

function enqueueScan(scanFolderIds?: string[]): void {
  pendingScans++
  notify()
  scanQueue = scanQueue
    .then(() => runScan(scanFolderIds))
    .catch((error) => console.error('[local-repos] scan failed', error))
    .finally(() => {
      pendingScans--
      if (pendingScans === 0) progress = null
      notify()
    })
}

async function runScan(scanFolderIds?: string[]): Promise<void> {
  const folders = db
    .listScanFolders()
    .filter((folder) => !scanFolderIds || scanFolderIds.includes(folder.id))
  if (!scanFolderIds) lastFullScanAt = Date.now()
  for (const folder of folders) {
    try {
      const stats = await fs.stat(folder.path)
      if (!stats.isDirectory()) throw new Error('Not a folder')
      const repositories = await scanFolder(folder.path, folder.id, folder.maxDepth, onProgress)
      db.saveScanFolderResult(folder.id, repositories)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[local-repos] scan failed for', folder.path, message)
      db.saveScanFolderResult(folder.id, [])
      db.markScanFolderError(folder.id, message)
    }
    notify()
  }
}
