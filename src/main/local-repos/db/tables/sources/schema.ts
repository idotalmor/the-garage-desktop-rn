/** `sources` table: the folders the user chose to scan and watch. */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const sources = sqliteTable('sources', {
  /** Random UUID made when the folder is added. */
  id: text('id').primaryKey(),
  /** Absolute path of the folder the user added with the + next to the source chips (unique). */
  path: text('path').notNull().unique(),
  /** How many folder levels below `path` the scanner searches for repos (default 4). */
  maxDepth: integer('max_depth').notNull(),
  /** When the user added the folder (epoch ms). */
  addedAt: integer('added_at').notNull(),
  /** When the last scan of this folder finished (epoch ms). Null until the first scan finishes. */
  lastScannedAt: integer('last_scanned_at'),
  /** Why the last scan failed, e.g. the folder was deleted or can't be read. Null if it worked. */
  lastError: text('last_error')
})

/** A `sources` row as read from the DB. Same shape as the app's `Source`. */
export type SourceDbEntity = typeof sources.$inferSelect
