/** The local repos SQLite file, `~/.devflow/local-repos.db`, with its tables (see `tables/`). */
import { openDatabase } from '../../sqlite'
import { CREATE_LOCAL_REPOS_TABLE } from './tables/local-repos/schema'
import { CREATE_LOCAL_WORKTREES_TABLE } from './tables/local-worktrees/schema'
import { CREATE_SOURCES_TABLE } from './tables/sources/schema'

export const { getDb, resetDb } = openDatabase('local-repos', [
  CREATE_SOURCES_TABLE,
  CREATE_LOCAL_REPOS_TABLE,
  CREATE_LOCAL_WORKTREES_TABLE
])
