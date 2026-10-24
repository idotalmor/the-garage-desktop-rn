/** Queues a full scan of one source, or of all of them when no id is given. */
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import { enqueueScan, getSnapshot } from '../sync'

export function rescan(sourceId?: string): LocalReposSnapshot {
  enqueueScan(sourceId ? [sourceId] : undefined)
  return getSnapshot()
}
