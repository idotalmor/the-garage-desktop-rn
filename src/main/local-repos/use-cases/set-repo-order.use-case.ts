/** Saves the user's repo order (from a sort or a drag): an array of repo ids, first = top. */
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import * as db from '../db'
import { getSnapshot, notify } from '../scan-service'

export function setRepoOrder(ids: string[]): LocalReposSnapshot {
  db.setRepositoryOrder(ids)
  notify()
  return getSnapshot()
}
