/** Wipes the local repos DB (sources, repos, worktrees) once the running job finishes. */
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import * as db from '../db'
import { cancelPendingChanges, enqueue, getSnapshot } from '../scan-service'

export async function resetLocalData(): Promise<LocalReposSnapshot> {
  cancelPendingChanges()
  await enqueue(async () => db.resetDatabase(), false)
  return getSnapshot()
}
