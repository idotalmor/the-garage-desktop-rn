/** The app updates SQLite file, `~/.devflow/app-updates.db`, opened with Drizzle (tables in `schema.ts`). */
import { openDatabase } from '../../sqlite'
import { CREATE_TABLES_SQL } from './create-tables.generated'
import * as schema from './schema'

export const { getDb, resetDb, transaction } = openDatabase('app-updates', {
  schema,
  createTablesSql: CREATE_TABLES_SQL
})

/** The typed Drizzle handle of this DB (a TypeScript type only). */
export type AppUpdatesDb = ReturnType<typeof getDb>
