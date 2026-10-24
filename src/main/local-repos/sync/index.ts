/**
 * Local repos at runtime: one job queue, live file watching and the UI snapshot. `startSync()`
 * wires them together once at startup. Use cases and `ipc.ts` import only from here.
 */
import { app } from 'electron'
import { listSources } from '../db/tables/sources/queries'
import { enqueueScan, onQueueEvent, rescanIfStale } from './job-queue'
import { stopWatching, syncWatching } from './live-sync'
import { notify } from './snapshot'

export { enqueue, enqueueScan } from './job-queue'
export { cancelPendingChanges, syncWatching } from './live-sync'
export { getSnapshot, notify, subscribe } from './snapshot'

/** Call once at app startup: watching, the initial scan and rescan-on-focus. */
export function startSync(): void {
  onQueueEvent('status', notify)
  onQueueEvent('done', () => {
    syncWatching()
    notify()
  })
  app.on('browser-window-focus', rescanIfStale)
  app.on('before-quit', stopWatching)
  syncWatching()
  if (listSources().length > 0) enqueueScan()
}
