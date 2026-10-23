/** Opens the local repos SQLite database (`~/.devflow/local-repos.db`) once and creates the tables. */
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import { CREATE_LOCAL_REPOS_TABLE } from './tables/local-repos'
import { CREATE_LOCAL_WORKTREES_TABLE } from './tables/local-worktrees'
import { CREATE_SOURCES_TABLE } from './tables/sources'

/** Bump when any table changes. A DB with another version is dropped and recreated empty (no migrations yet). */
const SCHEMA_VERSION = 3

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbDir = join(app.getPath('home'), '.devflow')
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

  db = new Database(join(dbDir, 'local-repos.db'))
  db.pragma('journal_mode = DELETE')
  db.pragma('foreign_keys = ON')
  if (db.pragma('user_version', { simple: true }) === SCHEMA_VERSION) createTables(db)
  else recreateTables(db)

  app.on('before-quit', () => db?.close())
  return db
}

/** Drops every table in the file, including ones older builds left behind, and creates them again empty. */
export function resetDb(): void {
  recreateTables(getDb())
}

function recreateTables(db: Database.Database): void {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .pluck()
    .all() as string[]
  db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      for (const table of tables) db.exec(`DROP TABLE IF EXISTS "${table}"`)
      createTables(db)
    })()
  } finally {
    db.pragma('foreign_keys = ON')
  }
  db.pragma(`user_version = ${SCHEMA_VERSION}`)
}

function createTables(db: Database.Database): void {
  db.exec(CREATE_SOURCES_TABLE)
  db.exec(CREATE_LOCAL_REPOS_TABLE)
  db.exec(CREATE_LOCAL_WORKTREES_TABLE)
}
