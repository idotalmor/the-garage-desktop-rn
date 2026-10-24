/** Removes a source and every repo that no remaining source covers, then re-points the watchers. */
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import * as db from '../db'
import { getSnapshot, notify, syncWatching } from '../scan-service'
import { uncoveredRepoIds } from '../utils/coverage'

export function removeSource(id: string): LocalReposSnapshot {
  db.transaction(() => {
    db.deleteSource(id)
    db.deleteRepositories(uncoveredRepoIds(db.listRepositories(), db.listSources()))
  })
  syncWatching()
  notify()
  return getSnapshot()
}
