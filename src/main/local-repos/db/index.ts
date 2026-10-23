/**
 * Public API of the local repos database. These are the operations the scan service needs; each
 * one may touch several tables (see `tables/`) inside a single transaction.
 */
import type { LocalRepository, ScanFolder } from '../../../shared/local-repos/types'
import { getDb } from './connection'
import {
  linkRepoToScanFolder,
  listLocalRepoScanFolderRows,
  unlinkAllReposFromScanFolder
} from './tables/local-repo-scan-folders'
import {
  deleteOrphanLocalRepos,
  listLocalRepoRows,
  toLocalRepository,
  upsertLocalRepo
} from './tables/local-repos'
import {
  listLocalWorktreeRows,
  replaceRepoWorktrees,
  toLocalWorktree
} from './tables/local-worktrees'
import {
  deleteScanFolder,
  insertScanFolders,
  listScanFolders as listScanFolderRows,
  markScanFolderScanned
} from './tables/scan-folders'

export function listScanFolders(): ScanFolder[] {
  return listScanFolderRows(getDb())
}

/** Saves new scan folders. Paths that are already saved are ignored. Returns only the new ones. */
export function addScanFolders(paths: string[]): ScanFolder[] {
  const db = getDb()
  const addedIds = db.transaction(() => insertScanFolders(db, paths))()
  return listScanFolderRows(db).filter((folder) => addedIds.includes(folder.id))
}

/** Deletes a scan folder and every repo that no other scan folder still covers. */
export function removeScanFolder(id: string): void {
  const db = getDb()
  db.transaction(() => {
    deleteScanFolder(db, id)
    deleteOrphanLocalRepos(db)
  })()
}

export function markScanFolderError(id: string, error: string): void {
  markScanFolderScanned(getDb(), id, error)
}

/** Replaces everything known about one scan folder with the latest scan result. */
export function saveScanFolderResult(scanFolderId: string, repositories: LocalRepository[]): void {
  const db = getDb()
  db.transaction(() => {
    unlinkAllReposFromScanFolder(db, scanFolderId)
    for (const repo of repositories) {
      upsertLocalRepo(db, repo)
      linkRepoToScanFolder(db, repo.id, scanFolderId)
      replaceRepoWorktrees(db, repo.id, repo.worktrees)
    }
    markScanFolderScanned(db, scanFolderId, null)
    deleteOrphanLocalRepos(db)
  })()
}

/** All repos with their scan folder ids and worktrees, sorted by name. */
export function listRepositories(): LocalRepository[] {
  const db = getDb()
  const links = listLocalRepoScanFolderRows(db)
  const worktrees = listLocalWorktreeRows(db)
  return listLocalRepoRows(db).map((row) =>
    toLocalRepository(
      row,
      links.filter((link) => link.repo_id === row.id).map((link) => link.scan_folder_id),
      worktrees.filter((tree) => tree.repo_id === row.id).map(toLocalWorktree)
    )
  )
}
