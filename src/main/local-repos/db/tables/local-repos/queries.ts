/** Queries on `local_repos` (with their worktrees). Each takes the open DB as its first argument. */
import { asc, eq, inArray, sql } from 'drizzle-orm'
import type { LocalRepository, ScannedRepository } from '../../../../../shared/local-repos/types'
import type { LocalReposDb } from '../../types'
import { localWorktrees } from '../local-worktrees/schema'
import { localRepos } from './schema'

/** Every repo with its checkouts, in the user's order (unplaced repos last, by name). */
export function listLocalReposWithWorktrees(db: LocalReposDb): LocalRepository[] {
  return db.query.localRepos
    .findMany({
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

/**
 * Inserts or updates a repo by id. Only table columns are written (`worktrees` is ignored), and
 * `position` isn't in a scan result, so scans never change the user's order. `updatedAt` never
 * moves backwards.
 */
export function upsertLocalRepo(db: LocalReposDb, repo: ScannedRepository): void {
  db.insert(localRepos)
    .values(repo)
    .onConflictDoUpdate({
      target: localRepos.id,
      set: { ...repo, updatedAt: sql`MAX(excluded.updated_at, ${localRepos.updatedAt})` }
    })
    .run()
}

/** Saves the user's order: `ids[0]` gets position 0. Repos not listed go back to unplaced (null). */
export function setLocalRepoPositions(db: LocalReposDb, ids: string[]): void {
  db.update(localRepos).set({ position: null }).run()
  ids.forEach((id, index) =>
    db.update(localRepos).set({ position: index }).where(eq(localRepos.id, id)).run()
  )
}

export function hasLocalRepo(db: LocalReposDb, id: string): boolean {
  return !!db.select({ id: localRepos.id }).from(localRepos).where(eq(localRepos.id, id)).get()
}

/** Deletes repos by id. Their worktrees cascade. */
export function deleteLocalRepos(db: LocalReposDb, ids: string[]): void {
  if (ids.length === 0) return
  db.delete(localRepos).where(inArray(localRepos.id, ids)).run()
}
