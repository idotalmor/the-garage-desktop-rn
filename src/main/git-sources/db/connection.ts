/** Lazy SQLite connection for connected Git accounts, repo cache and favorites. */
import { openDatabase } from '../../sqlite'
import { CREATE_TABLES_SQL } from './create-tables.generated'
import * as schema from './schema'
export const { getDb, resetDb, transaction } = openDatabase('git-sources', {
  schema,
  createTablesSql: CREATE_TABLES_SQL
})
export type GitSourcesDb = ReturnType<typeof getDb>
