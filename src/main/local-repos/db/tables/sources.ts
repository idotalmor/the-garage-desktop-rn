/** `sources` table: the folders the user chose to scan. */
import { randomUUID } from 'crypto'
import type Database from 'better-sqlite3'
import type { Source } from '../../../../shared/local-repos/types'

export const SOURCES_TABLE = 'sources'

/** How many folder levels a new source is searched by default. */
export const DEFAULT_MAX_DEPTH = 4

export type SourceDbEntity = {
  /** Random UUID made when the folder is added. */
  id: string
  /** Absolute path of the folder the user added under "Sources → Folders on this machine" (unique). */
  path: string
  /** How many folder levels below `path` the scanner searches for repos (default 4). */
  max_depth: number
  /** When the user added the folder (epoch ms). */
  added_at: number
  /** When the last scan of this folder finished (epoch ms). Null until the first scan finishes. */
  last_scanned_at: number | null
  /** Why the last scan failed, e.g. the folder was deleted or can't be read. Null if it worked. */
  last_error: string | null
}

export const CREATE_SOURCES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${SOURCES_TABLE} (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    max_depth INTEGER NOT NULL,
    added_at INTEGER NOT NULL,
    last_scanned_at INTEGER,
    last_error TEXT
  );
`

export function toSource(row: SourceDbEntity): Source {
  return {
    id: row.id,
    path: row.path,
    maxDepth: row.max_depth,
    addedAt: row.added_at,
    lastScannedAt: row.last_scanned_at,
    lastError: row.last_error
  }
}

export function listSources(db: Database.Database): Source[] {
  const rows = db
    .prepare(`SELECT * FROM ${SOURCES_TABLE} ORDER BY added_at`)
    .all() as SourceDbEntity[]
  return rows.map(toSource)
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
