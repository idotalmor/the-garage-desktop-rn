/**
 * Runs local-repos jobs one at a time (p-queue), whoever starts them: startup, window focus, an
 * added folder, a file change or Reset. Holds the scanning/progress status the UI shows and emits
 * `status` (status changed) and `done` (a job finished, so the DB may have changed).
 */
import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import type { ScanProgress } from '../../../shared/local-repos/types'
import { listSources } from '../db/tables/sources/queries'
import { scanSources } from '../use-cases/scan-sources.use-case'

const FOCUS_RESCAN_INTERVAL_MS = 5 * 60_000
const PROGRESS_NOTIFY_INTERVAL_MS = 250

const queue = new PQueue({ concurrency: 1 })
const events = new EventEmitter()
let pendingScans = 0
let progress: ScanProgress | null = null
let lastFullScanAt = 0
let lastProgressAt = 0

/** Whether a visible scan is queued or running, and its progress. */
export function scanStatus(): { scanning: boolean; progress: ScanProgress | null } {
  return { scanning: pendingScans > 0, progress }
}

export function onQueueEvent(event: 'status' | 'done', listener: () => void): void {
  events.on(event, listener)
}

/** Runs `job` after the jobs already queued. `visible` jobs count as scanning (spinner in the UI). */
export function enqueue(job: () => Promise<void>, visible: boolean): Promise<void> {
  if (visible) {
    pendingScans++
    events.emit('status')
  }
  return queue.add(async () => {
    try {
      await job()
    } catch (error) {
      console.error('[local-repos] job failed', error)
    } finally {
      if (visible) pendingScans--
      if (pendingScans === 0) progress = null
      events.emit('done')
    }
  })
}

/** Queues a full scan of the given sources (all when omitted), with progress shown in the UI. */
export function enqueueScan(sourceIds?: string[]): void {
  enqueue(() => {
    if (!sourceIds) lastFullScanAt = Date.now()
    return scanSources(sourceIds, { onProgress, onSourceScanned: () => events.emit('status') })
  }, true)
}

/** Full rescan when a window gets focus, at most every 5 minutes. */
export function rescanIfStale(): void {
  if (pendingScans > 0 || Date.now() - lastFullScanAt < FOCUS_RESCAN_INTERVAL_MS) return
  if (listSources().length > 0) enqueueScan()
}

function onProgress(next: ScanProgress): void {
  progress = next
  const now = Date.now()
  if (now - lastProgressAt < PROGRESS_NOTIFY_INTERVAL_MS) return
  lastProgressAt = now
  events.emit('status')
}
