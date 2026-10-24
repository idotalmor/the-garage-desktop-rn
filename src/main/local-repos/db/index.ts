/**
 * Public API of the local repos database: reads and writes in app types (`Source`,
 * `LocalRepository`), so callers never see rows or SQL. Business rules (what to delete when) live
 * in `use-cases/`, which wrap several of these in `transaction` when they must happen together.
 *
 * `sources` is the list of folders to scan and watch. `local_repos` and `local_worktrees` are
 * the result, keyed by path so a repo or checkout is stored once however many folders find it.
 * Which folders cover a repo is worked out from paths (`coveringSourceIds`), not stored.
 */
import type { LocalRepository, ScannedRepository, Source } from '../../../shared/local-repos/types'
import { coveringSourceIds } from '../utils/coverage'
import { getDb, resetDb } from './connection'
import {
  deleteLocalRepos,
  hasLocalRepo,
  listLocalReposWithWorktrees,
  setLocalRepoPositions,
  upsertLocalRepo
} from './tables/local-repos/queries'
import { replaceRepoWorktrees } from './tables/local-worktrees/queries'
import {
  deleteSource as deleteSourceRow,
  insertSources as insertSourceRows,
  listSourceDbEntities,
  markSourceScanned as markSourceScannedRow
} from './tables/sources/queries'

/** Runs `fn` in one transaction: every write inside it is saved together or not at all. Nests. */
export function transaction<T>(fn: () => T): T {
  return getDb().$client.transaction(fn)()
}

/** Deletes every source, repo and worktree (drops all tables and creates them again). */
export function resetDatabase(): void {
  resetDb()
}

export function listSources(): Source[] {
  return listSourceDbEntities(getDb())
}

/** Saves new sources. Paths that are already saved are ignored. Returns only the new ones. */
export function insertSources(paths: string[]): Source[] {
  const addedIds = insertSourceRows(getDb(), paths)
  return listSources().filter((source) => addedIds.includes(source.id))
}

export function deleteSource(id: string): void {
  deleteSourceRow(getDb(), id)
}

/** Records the end of a scan of a source: `error` is null when it succeeded. */
export function markSourceScanned(id: string, error: string | null): void {
  markSourceScannedRow(getDb(), id, error)
}

/** Upserts a repo (by its git dir, so never twice) and replaces its worktrees. */
export function saveRepository(repo: ScannedRepository): void {
  transaction(() => {
    upsertLocalRepo(getDb(), repo)
    replaceRepoWorktrees(getDb(), repo.id, repo.worktrees)
  })
}

export function hasRepository(id: string): boolean {
  return hasLocalRepo(getDb(), id)
}

/** Deletes repos (and, by cascade, their worktrees). */
export function deleteRepositories(ids: string[]): void {
  deleteLocalRepos(getDb(), ids)
}

/** Saves the user's repo order (first id = top). */
export function setRepositoryOrder(ids: string[]): void {
  transaction(() => setLocalRepoPositions(getDb(), ids))
}

/** All repos with their covering source ids and worktrees, in the user's order (unplaced ones last, by name). */
export function listRepositories(): LocalRepository[] {
  const sources = listSources()
  return listLocalReposWithWorktrees(getDb()).map((repo) => ({
    ...repo,
    sourceIds: coveringSourceIds(repo, sources)
  }))
}
