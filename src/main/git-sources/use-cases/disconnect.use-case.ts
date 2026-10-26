/** Removes only the chosen Git account's local credentials, repo cache and favorites. */
import type { GitSourcesSnapshot } from '../../../shared/git-sources/types'
import { deleteSource } from '../db/tables/git-sources/queries'
import { cancelAuthorization, notify } from '../sync'
export function disconnect(sourceId: string): GitSourcesSnapshot {
  cancelAuthorization()
  deleteSource(sourceId)
  return notify()
}
