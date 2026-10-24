/** Removes a source and every repo that no remaining source covers, then re-points the watchers. */
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import { transaction } from '../db/connection'
import { deleteRepos, listRepos } from '../db/tables/local-repos/queries'
import { deleteSource, listSources } from '../db/tables/sources/queries'
import { getSnapshot, notify, syncWatching } from '../sync'
import { uncoveredRepoIds } from '../utils/coverage'

export function removeSource(id: string): LocalReposSnapshot {
  transaction(() => {
    deleteSource(id)
    deleteRepos(uncoveredRepoIds(listRepos(), listSources()))
  })
  syncWatching()
  notify()
  return getSnapshot()
}
