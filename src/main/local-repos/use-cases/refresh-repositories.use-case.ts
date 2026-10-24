/**
 * Re-reads repos after a file change inside them. A repo whose git dir is gone is deleted, and so
 * is one no source covers anymore (e.g. its only checkout inside a source was removed). Run on
 * `scan-service`'s queue.
 */
import type { LocalRepository, ScannedRepository } from '../../../shared/local-repos/types'
import * as db from '../db'
import { reinspectRepository } from '../scanner/inspect'
import { uncoveredRepoIds } from '../utils/coverage'

export async function refreshRepositories(repoIds: string[]): Promise<void> {
  const gone: string[] = []
  for (const repo of db.listRepositories().filter((repo) => repoIds.includes(repo.id))) {
    const fresh = await reinspectRepository(repo).catch((error) => {
      console.error('[local-repos] refresh failed for', repo.commonDir, error)
      return undefined
    })
    if (fresh === null) gone.push(repo.id)
    else if (fresh) saveRefreshed(withActivity(repo, fresh))
  }
  db.deleteRepositories(gone)
}

/** Skipped if the repo was deleted meanwhile (e.g. its source was removed during the refresh). */
function saveRefreshed(repo: ScannedRepository): void {
  db.transaction(() => {
    if (!db.hasRepository(repo.id)) return
    db.saveRepository(repo)
    db.deleteRepositories(uncoveredRepoIds(db.listRepositories()))
  })
}

/** A live change that altered a checkout (commit, branch, changed files, worktrees) marks the repo updated now. */
function withActivity(before: LocalRepository, after: ScannedRepository): ScannedRepository {
  const changed = JSON.stringify(before.worktrees) !== JSON.stringify(after.worktrees)
  return { ...after, updatedAt: changed ? Date.now() : Math.max(before.updatedAt, after.updatedAt) }
}
