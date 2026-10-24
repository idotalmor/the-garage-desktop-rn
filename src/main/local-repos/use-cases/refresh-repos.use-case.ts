/**
 * Re-reads repos after a file change inside them. A repo whose git dir is gone is deleted, and so
 * is one no source covers anymore (e.g. its only checkout inside a source was removed). Run on
 * `scan-service`'s queue.
 */
import type { LocalRepo, LocalWorktree, ScannedRepo } from '../../../shared/local-repos/types'
import { transaction } from '../db/connection'
import { deleteRepos, hasRepo, listRepos, saveRepo } from '../db/tables/local-repos/queries'
import { listSources } from '../db/tables/sources/queries'
import { reinspectRepo } from '../scanner/inspect'
import { uncoveredRepoIds } from '../utils/coverage'

export async function refreshRepos(repoIds: string[]): Promise<void> {
  const gone: string[] = []
  for (const repo of listRepos().filter((repo) => repoIds.includes(repo.id))) {
    const fresh = await reinspectRepo(repo).catch((error) => {
      console.error('[local-repos] refresh failed for', repo.commonDir, error)
      return undefined
    })
    if (fresh === null) gone.push(repo.id)
    else if (fresh) saveRefreshed(withActivity(repo, fresh))
  }
  deleteRepos(gone)
}

/** Skipped if the repo was deleted meanwhile (e.g. its source was removed during the refresh). */
function saveRefreshed(repo: ScannedRepo): void {
  transaction(() => {
    if (!hasRepo(repo.id)) return
    saveRepo(repo)
    deleteRepos(uncoveredRepoIds(listRepos(), listSources()))
  })
}

/** A live change that altered a checkout (commit, branch, changed files, worktrees) marks the repo updated now. */
function withActivity(before: LocalRepo, after: ScannedRepo): ScannedRepo {
  const changed = worktreeState(before.worktrees) !== worktreeState(after.worktrees)
  return { ...after, updatedAt: changed ? Date.now() : Math.max(before.updatedAt, after.updatedAt) }
}

/** The checkout fields a live change can alter, in a fixed order so DB and scanner objects compare equal. */
function worktreeState(worktrees: LocalWorktree[]): string {
  return JSON.stringify(
    worktrees.map((tree) => [
      tree.path,
      tree.branch,
      tree.head,
      tree.isDetached,
      tree.isLocked,
      tree.isPrunable,
      tree.upstream,
      tree.ahead,
      tree.behind,
      tree.changedFiles,
      tree.lastCommit?.hash ?? null
    ])
  )
}
