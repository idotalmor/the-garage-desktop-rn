/** `sources` table: the folders the user chose to scan and watch. */

export const SOURCES_TABLE = 'sources'

export type SourceDbEntity = {
  /** Random UUID made when the folder is added. */
  id: string
  /** Absolute path of the folder the user added with the + next to the source chips (unique). */
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
