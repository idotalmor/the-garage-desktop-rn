/**
 * Scan service: owns the scan queue, the live scan state and the file watchers for local repos.
 *
 * - Full scans run on startup, after folders are added, on manual rescan, and when a window gets
 *   focus (at most every 5 minutes). These show progress in the UI.
 * - Live updates: every source (plus checkouts outside them) is watched recursively. A change
 *   inside a known repo re-checks only that repo; any other change in a source rescans that
 *   folder quietly (new or deleted clones). Changes are batched until things are quiet for 1s.
 * - All work runs one job at a time on one queue, saves through `db/` and notifies subscribers.
 *
 * It knows nothing about IPC or windows; `ipc.ts` subscribes and forwards snapshots to the UI.
 */
import { app } from 'electron'
import { promises as fs } from 'fs'
import type {
  LocalReposSnapshot,
  LocalRepository,
  Source,
  ScannedRepository,
  ScanProgress
} from '../../shared/local-repos/types'
import * as db from './db'
import { reinspectRepository } from './scanner/inspect'
import { scanSource } from './scanner/scan-source'
import { closeAllWatchers, syncWatchers } from './watcher/fs-watchers'
import { classifyChange, watchTargets } from './watcher/watch-targets'

const FOCUS_RESCAN_INTERVAL_MS = 5 * 60_000
const PROGRESS_NOTIFY_INTERVAL_MS = 250
/** Wait this long after the last file change before refreshing… */
const CHANGE_QUIET_MS = 1000
/** …but never longer than this after the first one (e.g. during a long `npm install`). */
const CHANGE_MAX_WAIT_MS = 5000

type Listener = (snapshot: LocalReposSnapshot) => void

const listeners = new Set<Listener>()
let pendingScans = 0
let progress: ScanProgress | null = null
let queue: Promise<void> = Promise.resolve()
let lastFullScanAt = 0
let lastProgressNotifyAt = 0

/** What the watchers currently cover, cached so file events don't hit the DB. */
let watched: { sources: Source[]; repositories: LocalRepository[] } = {
  sources: [],
  repositories: []
}
const changedRepoIds = new Set<string>()
const changedSourceIds = new Set<string>()
let changeTimer: NodeJS.Timeout | null = null
let firstChangeAt = 0

/** Current sources, repos and scan state. */
export function getSnapshot(): LocalReposSnapshot {
  return {
    sources: db.listSources(),
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
export async function addSources(paths: string[]): Promise<LocalReposSnapshot> {
  if (paths.length === 0) return getSnapshot()
  const realPaths = await Promise.all(paths.map((path) => fs.realpath(path).catch(() => path)))
  const added = db.addSources(realPaths)
  if (added.length > 0) enqueueScan(added.map((folder) => folder.id))
  return getSnapshot()
}

export function removeSource(id: string): LocalReposSnapshot {
  db.removeSource(id)
  syncWatching()
  notify()
  return getSnapshot()
}

/** Rescans one source, or all of them when no id is given. */
export function rescan(sourceId?: string): LocalReposSnapshot {
  enqueueScan(sourceId ? [sourceId] : undefined)
  return getSnapshot()
}

/** Wipes the local repos DB (sources, repos, worktrees) after the running job finishes. */
export async function reset(): Promise<LocalReposSnapshot> {
  if (changeTimer) clearTimeout(changeTimer)
  changeTimer = null
  changedRepoIds.clear()
  changedSourceIds.clear()
  await enqueue(async () => db.resetDatabase(), false)
  return getSnapshot()
}

/** Starts watching, the initial scan and the rescan-on-focus behavior. Call once at app startup. */
export function startScanService(): void {
  app.on('browser-window-focus', rescanIfStale)
  app.on('before-quit', closeAllWatchers)
  syncWatching()
  if (db.listSources().length > 0) enqueueScan()
}

function rescanIfStale(): void {
  if (pendingScans > 0 || Date.now() - lastFullScanAt < FOCUS_RESCAN_INTERVAL_MS) return
  if (db.listSources().length > 0) enqueueScan()
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

/** Points the watchers at the current sources and repos. Run after every DB change. */
function syncWatching(): void {
  watched = { sources: db.listSources(), repositories: db.listRepositories() }
  syncWatchers(watchTargets(watched.sources, watched.repositories), onPathChanged)
}

function onPathChanged(path: string): void {
  const change = classifyChange(path, watched.sources, watched.repositories)
  if (!change) return
  if (change.kind === 'repo') changedRepoIds.add(change.repoId)
  else change.sourceIds.forEach((id) => changedSourceIds.add(id))

  const now = Date.now()
  if (changeTimer) clearTimeout(changeTimer)
  else firstChangeAt = now
  const wait = Math.min(CHANGE_QUIET_MS, Math.max(0, firstChangeAt + CHANGE_MAX_WAIT_MS - now))
  changeTimer = setTimeout(flushChanges, wait)
}

function flushChanges(): void {
  changeTimer = null
  const sourceIds = [...changedSourceIds]
  const repoIds = [...changedRepoIds]
  changedSourceIds.clear()
  changedRepoIds.clear()
  if (sourceIds.length > 0) enqueue(() => runScan(sourceIds, false), false)
  if (repoIds.length > 0) enqueue(() => refreshRepositories(repoIds), false)
}

/** Full scans are `visible` (spinner + progress in the UI); live refreshes run quietly. */
function enqueueScan(sourceIds?: string[]): void {
  enqueue(() => runScan(sourceIds, true), true)
}

function enqueue(job: () => Promise<void>, visible: boolean): Promise<void> {
  if (visible) {
    pendingScans++
    notify()
  }
  queue = queue
    .then(job)
    .catch((error) => console.error('[local-repos] job failed', error))
    .finally(() => {
      if (visible) pendingScans--
      if (pendingScans === 0) progress = null
      syncWatching()
      notify()
    })
  return queue
}

async function runScan(sourceIds: string[] | undefined, visible: boolean): Promise<void> {
  const folders = db.listSources().filter((folder) => !sourceIds || sourceIds.includes(folder.id))
  if (!sourceIds) lastFullScanAt = Date.now()
  for (const folder of folders) {
    try {
      const stats = await fs.stat(folder.path)
      if (!stats.isDirectory()) throw new Error('Not a folder')
      const repositories = await scanSource(
        folder.path,
        folder.maxDepth,
        visible ? onProgress : undefined
      )
      db.saveSourceResult(folder.id, repositories)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[local-repos] scan failed for', folder.path, message)
      db.saveSourceResult(folder.id, [])
      db.markSourceError(folder.id, message)
    }
    if (visible) notify()
  }
  await deleteMissingRepositories()
}

/** Deletes repos whose git dir is gone, including ones another source still covers. */
async function deleteMissingRepositories(): Promise<void> {
  const missing: string[] = []
  for (const repo of db.listRepositories()) {
    if (
      !(await fs.access(repo.commonDir).then(
        () => true,
        () => false
      ))
    )
      missing.push(repo.id)
  }
  db.deleteRepositories(missing)
}

/** Re-checks changed repos. A repo whose git dir is gone is deleted. */
async function refreshRepositories(repoIds: string[]): Promise<void> {
  const gone: string[] = []
  for (const repo of db.listRepositories().filter((repo) => repoIds.includes(repo.id))) {
    const fresh = await reinspectRepository(repo).catch((error) => {
      console.error('[local-repos] refresh failed for', repo.commonDir, error)
      return undefined
    })
    if (fresh === null) gone.push(repo.id)
    else if (fresh) db.saveRepository(withActivity(repo, fresh))
  }
  db.deleteRepositories(gone)
}

/** A live change that altered a checkout (commit, branch, changed files, worktrees) marks the repo updated now. */
function withActivity(before: LocalRepository, after: ScannedRepository): ScannedRepository {
  const changed = JSON.stringify(before.worktrees) !== JSON.stringify(after.worktrees)
  return { ...after, updatedAt: changed ? Date.now() : Math.max(before.updatedAt, after.updatedAt) }
}
