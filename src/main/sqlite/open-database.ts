/**
 * Opens a feature's SQLite file, `~/.devflow/<name>.db`, on first use: creates the folder, sets the
 * pragmas, creates missing tables and closes it on quit. No migrations: tables that already exist
 * are left as they are; `resetDb` drops everything and creates the current tables again.
 */
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'

export type SqliteDatabase = {
  /** The open connection (opened on the first call). */
  getDb: () => Database.Database
  /** Drops every table in the file and creates the current ones again, empty. */
  resetDb: () => void
}

/** `createTables`: each table's `CREATE TABLE IF NOT EXISTS …` (plus indexes), in dependency order. */
export function openDatabase(name: string, createTables: string[]): SqliteDatabase {
  let db: Database.Database | null = null

  const create = (connection: Database.Database): void => {
    for (const sql of createTables) connection.exec(sql)
  }

  const getDb = (): Database.Database => {
    if (db) return db
    const dir = join(app.getPath('home'), '.devflow')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    db = new Database(join(dir, `${name}.db`))
    db.pragma('journal_mode = DELETE')
    db.pragma('foreign_keys = ON')
    create(db)

    app.on('before-quit', () => db?.close())
    return db
  }

  const resetDb = (): void => {
    const connection = getDb()
    const tables = connection
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .pluck()
      .all() as string[]
    connection.pragma('foreign_keys = OFF')
    try {
      connection.transaction(() => {
        for (const table of tables) connection.exec(`DROP TABLE IF EXISTS "${table}"`)
        create(connection)
      })()
    } finally {
      connection.pragma('foreign_keys = ON')
    }
  }

  return { getDb, resetDb }
}
