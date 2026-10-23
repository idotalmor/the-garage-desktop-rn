/**
 * `local_repo_scan_folders` table: which scan folders found which repos (many-to-many).
 * Two scan folders can cover the same repo; a repo is kept until no scan folder references it.
 */
import type Database from 'better-sqlite3'

export const LOCAL_REPO_SCAN_FOLDERS_TABLE = 'local_repo_scan_folders'

export type LocalRepoScanFolderRow = {
  repo_id: string
  scan_folder_id: string
}

export const CREATE_LOCAL_REPO_SCAN_FOLDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${LOCAL_REPO_SCAN_FOLDERS_TABLE} (
    repo_id TEXT NOT NULL REFERENCES local_repos(id) ON DELETE CASCADE,
    scan_folder_id TEXT NOT NULL REFERENCES scan_folders(id) ON DELETE CASCADE,
    PRIMARY KEY (repo_id, scan_folder_id)
  );
`

export function listLocalRepoScanFolderRows(db: Database.Database): LocalRepoScanFolderRow[] {
  return db
    .prepare(`SELECT repo_id, scan_folder_id FROM ${LOCAL_REPO_SCAN_FOLDERS_TABLE}`)
    .all() as LocalRepoScanFolderRow[]
}

export function linkRepoToScanFolder(
  db: Database.Database,
  repoId: string,
  scanFolderId: string
): void {
  db.prepare(
    `INSERT OR IGNORE INTO ${LOCAL_REPO_SCAN_FOLDERS_TABLE} (repo_id, scan_folder_id) VALUES (?, ?)`
  ).run(repoId, scanFolderId)
}

export function unlinkAllReposFromScanFolder(db: Database.Database, scanFolderId: string): void {
  db.prepare(`DELETE FROM ${LOCAL_REPO_SCAN_FOLDERS_TABLE} WHERE scan_folder_id = ?`).run(
    scanFolderId
  )
}
