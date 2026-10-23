/**
 * Public API of the local repos database. These are the operations the scan service needs; each
 * one may touch several tables (see `tables/`) inside a single transaction.
 *
 * `scan_folders` is the list of folders to scan and watch. `local_repos` and `local_worktrees` are
 * the result, keyed by path so a repo or checkout is stored once however many folders find it.
 * Which folders cover a repo is worked out from paths (`coveringScanFolderIds`), not stored.
 */
import type Database from 'better-sqlite3'
import type {
  LocalRepository,
  ScanFolder,
  ScannedRepository
} from '../../../shared/local-repos/types'
import { coveringScanFolderIds } from '../utils/paths'
import { getDb } from './connection'
import {
  deleteLocalRepos,
  hasLocalRepo,
  listLocalRepoDbEntities,
  toLocalRepository,
  upsertLocalRepo
} from './tables/local-repos'
import {
  listLocalWorktreeDbEntities,
  replaceRepoWorktrees,
  toLocalWorktree
} from './tables/local-worktrees'
import {
  deleteScanFolder,
  insertScanFolders,
  listScanFolders as listScanFolderDbEntities,
  markScanFolderScanned
} from './tables/scan-folders'

export function listScanFolders(): ScanFolder[] {
  return listScanFolderDbEntities(getDb())
}

/** Saves new scan folders. Paths that are already saved are ignored. Returns only the new ones. */
export function addScanFolders(paths: string[]): ScanFolder[] {
  const db = getDb()
  const addedIds = db.transaction(() => insertScanFolders(db, paths))()
  return listScanFolderDbEntities(db).filter((folder) => addedIds.includes(folder.id))
}

/** Deletes a scan folder and every repo that no remaining scan folder covers. */
export function removeScanFolder(id: string): void {
  const db = getDb()
  db.transaction(() => {
    deleteScanFolder(db, id)
    deleteLocalRepos(db, uncoveredRepoIds(db))
  })()
}

export function markScanFolderError(id: string, error: string): void {
  markScanFolderScanned(getDb(), id, error)
}

/**
 * Saves what one scan folder found. Found repos are upserted (by their git dir, so never twice).
 * Repos this folder covers but no longer finds are deleted, unless another folder also covers them.
 */
export function saveScanFolderResult(
  scanFolderId: string,
  repositories: ScannedRepository[]
): void {
  const db = getDb()
  db.transaction(() => {
    for (const repo of repositories) {
      upsertLocalRepo(db, repo)
      replaceRepoWorktrees(db, repo.id, repo.worktrees)
    }
    markScanFolderScanned(db, scanFolderId, null)
    const found = new Set(repositories.map((repo) => repo.id))
    const stale = readRepositories(db).filter(
      (repo) => !found.has(repo.id) && repo.scanFolderIds.every((id) => id === scanFolderId)
    )
    deleteLocalRepos(
      db,
      stale.map((repo) => repo.id)
    )
  })()
}

/**
 * Updates one repo and its worktrees after a live change. Skipped if the repo was deleted
 * meanwhile; deleted if no scan folder covers it anymore (e.g. its only checkout in one was removed).
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

/** All repos with their covering scan folder ids and worktrees, sorted by name. */
export function listRepositories(): LocalRepository[] {
  return readRepositories(getDb())
}

function readRepositories(db: Database.Database): LocalRepository[] {
  const scanFolders = listScanFolderDbEntities(db)
  const worktrees = listLocalWorktreeDbEntities(db)
  return listLocalRepoDbEntities(db).map((row) => {
    const trees = worktrees.filter((tree) => tree.repo_id === row.id).map(toLocalWorktree)
    const scanFolderIds = coveringScanFolderIds(
      { commonDir: row.common_dir, worktrees: trees },
      scanFolders
    )
    return toLocalRepository(row, scanFolderIds, trees)
  })
}

function uncoveredRepoIds(db: Database.Database): string[] {
  return readRepositories(db)
    .filter((repo) => repo.scanFolderIds.length === 0)
    .map((repo) => repo.id)
}
