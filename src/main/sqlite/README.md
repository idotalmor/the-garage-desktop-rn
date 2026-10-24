# SQLite library (`src/main/sqlite`)

Opens feature databases: `better-sqlite3` wrapped with [Drizzle ORM](https://orm.drizzle.team).
Each feature keeps its own file under `~/.devflow/`, its own tables and its own
`create-tables.generated.ts`; this folder only holds what every feature DB needs.

[`open-database.ts`](open-database.ts): `openDatabase(name, { schema, createTablesSql })` returns
`{ getDb, resetDb }`.

- `getDb()` opens `~/.devflow/<name>.db` on first use, sets `journal_mode = DELETE` and
  `foreign_keys = ON`, runs `createTablesSql` (every statement is `IF NOT EXISTS`), and returns the
  typed Drizzle handle. The raw connection is `getDb().$client`. The file is closed on quit.
- `resetDb()` drops every table in the file and runs `createTablesSql` again.

A feature's `db/connection.ts`:

```ts
import { CREATE_TABLES_SQL } from './create-tables.generated'
import * as schema from './schema'

export const { getDb, resetDb } = openDatabase('local-repos', {
  schema,
  createTablesSql: CREATE_TABLES_SQL
})
```

`create-tables.generated.ts` comes from `npm run db:generate` (`scripts/generate-db-schema.mjs`
runs `drizzle-kit export` for each config in its list). Add a new DB's `drizzle.config.ts` there.

No migrations or schema versions: missing tables are created, existing ones are never altered.
After a schema change, regenerate and reset the data.

Not on it yet: `notes`, `artifactory` and `focus-timer-repository` still open their DBs themselves.
