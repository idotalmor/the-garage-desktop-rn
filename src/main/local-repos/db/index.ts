/**
 * Public API of the local repos database. These are the operations the scan service needs; each
 * one may touch several tables (see `tables/`) inside a single transaction.
 *
 * `sources` is the list of folders to scan and watch. `local_repos` and `local_worktrees` are
 * the result, keyed by path so a repo or checkout is stored once however many folders find it.
 * Which folders cover a repo is worked out from paths (`coveringSourceIds`), not stored.
 */
import type Database from 'better-sqlite3'
import type { LocalRepository, Source, ScannedRepository } from '../../../shared/local-repos/types'
import { coveringSourceIds } from '../utils/paths'
import { getDb, resetDb } from './connection'
import {
  deleteLocalRepos,
  hasLocalRepo,
  listLocalRepoDbEntities,
  setLocalRepoPositions,
  toLocalRepository,
  upsertLocalRepo
} from './tables/local-repos'
import {
  listLocalWorktreeDbEntities,
  replaceRepoWorktrees,
  toLocalWorktree
} from './tables/local-worktrees'
import {
  deleteSource,
  insertSources,
  listSources as listSourceDbEntities,
  markSourceScanned
} from './tables/sources'

/** Deletes every source, repo and worktree. */
export function resetDatabase(): void {
  resetDb()
}

export function listSources(): Source[] {
  return listSourceDbEntities(getDb())
}

/** Saves new sources. Paths that are already saved are ignored. Returns only the new ones. */
export function addSources(paths: string[]): Source[] {
  const db = getDb()
  const addedIds = db.transaction(() => insertSources(db, paths))()
  return listSourceDbEntities(db).filter((folder) => addedIds.includes(folder.id))
}

/** Deletes a source and every repo that no remaining source covers. */
export function removeSource(id: string): void {
  const db = getDb()
  db.transaction(() => {
    deleteSource(db, id)
    deleteLocalRepos(db, uncoveredRepoIds(db))
  })()
}

export function markSourceError(id: string, error: string): void {
  markSourceScanned(getDb(), id, error)
}

/**
 * Saves what one source found. Found repos are upserted (by their git dir, so never twice).
 * Repos this folder covers but no longer finds are deleted, unless another folder also covers them.
 */
export function saveSourceResult(sourceId: string, repositories: ScannedRepository[]): void {
  const db = getDb()
  db.transaction(() => {
    for (const repo of repositories) {
      upsertLocalRepo(db, repo)
      replaceRepoWorktrees(db, repo.id, repo.worktrees)
    }
    markSourceScanned(db, sourceId, null)
    const found = new Set(repositories.map((repo) => repo.id))
    const stale = readRepositories(db).filter(
      (repo) => !found.has(repo.id) && repo.sourceIds.every((id) => id === sourceId)
    )
    deleteLocalRepos(
      db,
      stale.map((repo) => repo.id)
    )
  })()
}

/**
 * Updates one repo and its worktrees after a live change. Skipped if the repo was deleted
 * meanwhile; deleted if no source covers it anymore (e.g. its only checkout in one was removed).
 */
export function saveRepository(repo: ScannedRepository): void {
  const db = getDb()
  db.transaction(() => {
    if (!hasLocalRepo(db, repo.id)) return
    upsertLocalRepo(db, repo)
    replaceRepoWorktrees(db, repo.id, repo.worktrees)
    deleteLocalRepos(db, uncoveredRepoIds(db))
  })()
}

/** Deletes repos (and their worktrees), e.g. ones whose git dir no longer exists. */
export function deleteRepositories(ids: string[]): void {
  if (ids.length === 0) return
  const db = getDb()
  db.transaction(() => deleteLocalRepos(db, ids))()
}

/** Saves the user's repo order (first id = top). */
export function setRepositoryOrder(ids: string[]): void {
  const db = getDb()
  db.transaction(() => setLocalRepoPositions(db, ids))()
}

/** All repos with their covering source ids and worktrees, in the user's order (unplaced ones last, by name). */
export function listRepositories(): LocalRepository[] {
  return readRepositories(getDb())
}

function readRepositories(db: Database.Database): LocalRepository[] {
  const sources = listSourceDbEntities(db)
  const worktrees = listLocalWorktreeDbEntities(db)
  return listLocalRepoDbEntities(db).map((row) => {
    const trees = worktrees.filter((tree) => tree.repo_id === row.id).map(toLocalWorktree)
    const sourceIds = coveringSourceIds({ commonDir: row.common_dir, worktrees: trees }, sources)
    return toLocalRepository(row, sourceIds, trees)
  })
}

function uncoveredRepoIds(db: Database.Database): string[] {
  return readRepositories(db)
    .filter((repo) => repo.sourceIds.length === 0)
    .map((repo) => repo.id)
}
