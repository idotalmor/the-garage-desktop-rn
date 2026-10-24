# SQLite library (`src/main/sqlite`)

Shared helpers for feature databases (`better-sqlite3`). Each feature keeps its own file under
`~/.devflow/` and its own tables; this folder only holds what every feature DB needs.

- [`open-database.ts`](open-database.ts): `openDatabase(name, createTables)` returns
  `{ getDb, resetDb }`. It opens `~/.devflow/<name>.db` on first use, sets `journal_mode = DELETE`
  and `foreign_keys = ON`, runs each `CREATE TABLE IF NOT EXISTS`, and closes the file on quit.
  `resetDb` drops every table in the file and creates the current ones again empty.
- [`json.ts`](json.ts): `Json<T>` for TEXT columns that hold JSON, with `toJson` and a safe
  `parseJson(value, fallback)`.

A feature's `db/connection.ts` is one call:

```ts
export const { getDb, resetDb } = openDatabase('local-repos', [CREATE_SOURCES_TABLE, …])
```

No migrations or schema versions: missing tables are created, existing ones are never altered.
After a schema change the user resets the data.

Not on it yet: `notes`, `artifactory` and `focus-timer-repository` still open their DBs themselves.
