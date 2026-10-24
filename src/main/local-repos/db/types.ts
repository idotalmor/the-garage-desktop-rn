/** The typed Drizzle handle of the local repos DB, taken by every query function. */
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type * as schema from './schema'

export type LocalReposDb = BetterSQLite3Database<typeof schema>
