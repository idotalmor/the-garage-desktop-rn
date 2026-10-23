/** Opens the local repos SQLite database (`~/.devflow/local-repos.db`) once and creates the tables. */
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import { CREATE_LOCAL_REPOS_TABLE } from './tables/local-repos'
import { CREATE_LOCAL_WORKTREES_TABLE } from './tables/local-worktrees'
import { CREATE_SCAN_FOLDERS_TABLE } from './tables/scan-folders'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbDir = join(app.getPath('home'), '.devflow')
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

  db = new Database(join(dbDir, 'local-repos.db'))
  db.pragma('journal_mode = DELETE')
  db.pragma('foreign_keys = ON')
  db.exec(CREATE_SCAN_FOLDERS_TABLE)
  db.exec(CREATE_LOCAL_REPOS_TABLE)
  db.exec(CREATE_LOCAL_WORKTREES_TABLE)
  // Older builds stored scan folder ↔ repo links; that is now worked out from paths.
  db.exec('DROP TABLE IF EXISTS local_repo_scan_folders')

  app.on('before-quit', () => db?.close())
  return db
}
