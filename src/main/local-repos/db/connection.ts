/** The local repos SQLite file, `~/.devflow/local-repos.db`, opened with Drizzle (tables in `schema.ts`). */
import { openDatabase } from '../../sqlite'
import { CREATE_TABLES_SQL } from './create-tables.generated'
import * as schema from './schema'

export const { getDb, resetDb } = openDatabase('local-repos', {
  schema,
  createTablesSql: CREATE_TABLES_SQL
})
