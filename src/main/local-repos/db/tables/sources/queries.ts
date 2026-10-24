/** Single-table queries on `sources`. Each takes the open DB as its first argument. */
import { randomUUID } from 'crypto'
import type Database from 'better-sqlite3'
import { SOURCES_TABLE, type SourceDbEntity } from './schema'

/** How many folder levels a new source is searched by default. */
export const DEFAULT_MAX_DEPTH = 4

export function listSourceDbEntities(db: Database.Database): SourceDbEntity[] {
  return db.prepare(`SELECT * FROM ${SOURCES_TABLE} ORDER BY added_at`).all() as SourceDbEntity[]
}

/** Inserts the paths that aren't saved yet. Returns the ids of the newly inserted rows. */
export function insertSources(
  db: Database.Database,
  paths: string[],
  maxDepth = DEFAULT_MAX_DEPTH
): string[] {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO ${SOURCES_TABLE} (id, path, max_depth, added_at) VALUES (?, ?, ?, ?)`
  )
  const added: string[] = []
  for (const path of paths) {
    const id = randomUUID()
    if (insert.run(id, path, maxDepth, Date.now()).changes > 0) added.push(id)
  }
  return added
}

export function deleteSource(db: Database.Database, id: string): void {
  db.prepare(`DELETE FROM ${SOURCES_TABLE} WHERE id = ?`).run(id)
}

/** Records the end of a scan: `error` is null when it succeeded. */
export function markSourceScanned(db: Database.Database, id: string, error: string | null): void {
  db.prepare(`UPDATE ${SOURCES_TABLE} SET last_scanned_at = ?, last_error = ? WHERE id = ?`).run(
    Date.now(),
    error,
    id
  )
}
