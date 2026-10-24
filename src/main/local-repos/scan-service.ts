/**
 * Scan service: the state of local repos at runtime. It owns the job queue, scan progress, the file
 * watchers and the subscribers; the work itself is in `use-cases/`.
 *
 * - Full scans run on startup, after folders are added, and when a window gets focus (at most every
 *   5 minutes). These show progress in the UI.
 * - Live updates: every source (plus checkouts outside them) is watched recursively. A change
 *   inside a known repo re-checks only that repo; any other change in a source rescans that
 *   folder quietly (new or deleted clones). Changes are batched until things are quiet for 1s.
 * - All jobs run one at a time on one queue, then the watchers are re-pointed and subscribers notified.
 *
 * It knows nothing about IPC or windows; `ipc.ts` subscribes and forwards snapshots to the UI.
 */
import { app } from 'electron'
import type {
  LocalReposSnapshot,
  LocalRepo,
  ScanProgress,
  Source
} from '../../shared/local-repos/types'
import { listRepos } from './db/tables/local-repos/queries'
import { listSources } from './db/tables/sources/queries'
import { refreshRepos } from './use-cases/refresh-repos.use-case'
import { scanSources } from './use-cases/scan-sources.use-case'
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
let watched: { sources: Source[]; repos: LocalRepo[] } = {
  sources: [],
  repos: []
}
const changedRepoIds = new Set<string>()
const changedSourceIds = new Set<string>()
let changeTimer: NodeJS.Timeout | null = null
let firstChangeAt = 0

/** Current sources, repos and scan state. */
export function getSnapshot(): LocalReposSnapshot {
  return {
    sources: listSources(),
    repos: listRepos(),
    scanning: pendingScans > 0,
    progress
  }
}

/** Calls `listener` with a new snapshot whenever anything changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Sends the current snapshot to every subscriber. */
export function notify(): void {
  const snapshot = getSnapshot()
  for (const listener of listeners) listener(snapshot)
}

/** Queues a full scan of the given sources (all when omitted), with progress shown in the UI. */
export function enqueueScan(sourceIds?: string[]): void {
  enqueue(() => {
    if (!sourceIds) lastFullScanAt = Date.now()
    return scanSources(sourceIds, { onProgress, onSourceScanned: notify })
  }, true)
}

/**
 * Runs `job` after the jobs already queued. `visible` jobs count as scanning (spinner in the UI).
 * Afterwards the watchers are re-pointed and subscribers notified.
 */
export function enqueue(job: () => Promise<void>, visible: boolean): Promise<void> {
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

/** Points the watchers at the current sources and repos. Run after every DB change. */
export function syncWatching(): void {
  watched = { sources: listSources(), repos: listRepos() }
  syncWatchers(watchTargets(watched.sources, watched.repos), onPathChanged)
}

/** Drops file changes that are waiting to be processed (e.g. before a reset). */
export function cancelPendingChanges(): void {
  if (changeTimer) clearTimeout(changeTimer)
  changeTimer = null
  changedRepoIds.clear()
  changedSourceIds.clear()
}

/** Starts watching, the initial scan and the rescan-on-focus behavior. Call once at app startup. */
export function startScanService(): void {
  app.on('browser-window-focus', rescanIfStale)
  app.on('before-quit', closeAllWatchers)
  syncWatching()
  if (listSources().length > 0) enqueueScan()
}

function rescanIfStale(): void {
  if (pendingScans > 0 || Date.now() - lastFullScanAt < FOCUS_RESCAN_INTERVAL_MS) return
  if (listSources().length > 0) enqueueScan()
}

function onProgress(next: ScanProgress): void {
  progress = next
  const now = Date.now()
  if (now - lastProgressNotifyAt < PROGRESS_NOTIFY_INTERVAL_MS) return
  lastProgressNotifyAt = now
  notify()
}

function onPathChanged(path: string): void {
  const change = classifyChange(path, watched.sources, watched.repos)
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
  if (sourceIds.length > 0) enqueue(() => scanSources(sourceIds), false)
  if (repoIds.length > 0) enqueue(() => refreshRepos(repoIds), false)
}
