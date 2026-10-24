/** Reads and writes of `local_repos` (with their worktrees). Rows come back as the app's `LocalRepo`. */
import { asc, eq, inArray, sql } from 'drizzle-orm'
import type { LocalRepo, ScannedRepo } from '../../../../../shared/local-repos/types'
import { getDb, transaction } from '../../connection'
import { localWorktrees } from '../local-worktrees/schema'
import { replaceRepoWorktrees } from '../local-worktrees/queries'
import { localRepos } from './schema'

/** Every repo with its checkouts, in the user's order (unplaced repos last, by name). */
export function listRepos(): LocalRepo[] {
  return getDb()
    .query.localRepos.findMany({
      orderBy: [
        sql`${localRepos.position} IS NULL`,
        asc(localRepos.position),
        asc(localRepos.name)
      ],
      with: {
        worktrees: {
          columns: { repoId: false, position: false },
          orderBy: [asc(localWorktrees.position)]
        }
      }
    })
    .sync()
}

/** One repo with its checkouts, or null if it isn't stored. */
export function findRepo(id: string): LocalRepo | null {
  return (
    getDb()
      .query.localRepos.findFirst({
        where: eq(localRepos.id, id),
        with: {
          worktrees: {
            columns: { repoId: false, position: false },
            orderBy: [asc(localWorktrees.position)]
          }
        }
      })
      .sync() ?? null
  )
}

export function hasRepo(id: string): boolean {
  return !!getDb().select({ id: localRepos.id }).from(localRepos).where(eq(localRepos.id, id)).get()
}

/**
 * Upserts a repo by id (so never twice) and replaces its worktrees, in one transaction. Only table
 * columns go into `local_repos` (`worktrees` go to their own table), and a scan result has no
 * `position`, so scans never change the user's order. `updatedAt` never moves backwards.
 */
export function saveRepo(repo: ScannedRepo): void {
  transaction(() => {
    getDb()
      .insert(localRepos)
      .values(repo)
      .onConflictDoUpdate({
        target: localRepos.id,
        set: { ...repo, updatedAt: sql`MAX(excluded.updated_at, ${localRepos.updatedAt})` }
      })
      .run()
    replaceRepoWorktrees(repo.id, repo.worktrees)
  })
}

/** Deletes repos by id. Their worktrees cascade. */
export function deleteRepos(ids: string[]): void {
  if (ids.length === 0) return
  getDb().delete(localRepos).where(inArray(localRepos.id, ids)).run()
}

/** Saves the user's order: `ids[0]` gets position 0. Repos not listed go back to unplaced (null). */
export function saveRepoPositions(ids: string[]): void {
  transaction(() => {
    getDb().update(localRepos).set({ position: null }).run()
    ids.forEach((id, index) =>
      getDb().update(localRepos).set({ position: index }).where(eq(localRepos.id, id)).run()
    )
  })
}
