/** Saves the user's repo order (from a sort or a drag): an array of repo ids, first = top. */
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import { saveRepoPositions } from '../db/tables/local-repos/queries'
import { getSnapshot, notify } from '../sync'

export function setRepoOrder(ids: string[]): LocalReposSnapshot {
  saveRepoPositions(ids)
  notify()
  return getSnapshot()
}
