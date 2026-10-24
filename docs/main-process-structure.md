# Main-process feature structure

How to lay out a feature in `src/main/`. `src/main/local-repos/` is the reference implementation;
copy its shape. Follow this when adding a feature, and refactor to it when a file you touch mixes
the layers below.

## Layers

Each feature lives in `src/main/<feature>/` with its contract in `src/shared/<feature>/`.

```
src/shared/<feature>/
  types.ts            domain types the renderer sees; every field has a /** comment */
  channels.ts         `<Feature>Channel` const of IPC channel names; one comment per channel

src/main/<feature>/
  ipc.ts              communication only: each handler calls one use case
  use-cases/          business rules, one file per user action or background job
    <action>.use-case.ts
    index.ts          re-exports them
  <name>-service.ts   runtime state only (queues, progress, timers, watchers, subscriptions)
  <domain>/           feature-specific work, split by concern (e.g. scanner/, watcher/)
  db/                 SQLite persistence (only if the feature stores data)
    connection.ts     `getDb`, `resetDb`, `transaction` from one `openDatabase(...)` call, + `<Feature>Db` type
    schema.ts         re-exports every table + relations (for Drizzle and drizzle-kit)
    drizzle.config.ts drizzle-kit config for this DB
    create-tables.generated.ts  CREATE TABLE IF NOT EXISTS …, from `npm run db:generate`
    tables/<table>/schema.ts    Drizzle table + `<Name>DbEntity` (inferred)
    tables/<table>/queries.ts   reads/writes in app types (call `getDb()`); use cases import these
    tables/relations.ts         how tables link, for relational queries
    tables/README.md  what each table is + diagrams (see below)
  utils/              small pure helpers with no feature state (path rules, concurrency)

src/main/<library>/   code shared by features, with no IPC and no state: e.g.
  git/                typed git CLI questions (run.ts, parsers/, queries/, index.ts)
  sqlite/             openDatabase (better-sqlite3 + Drizzle)
src/shared/<library>/ types from a library that the renderer also sees (e.g. shared/git/types.ts)
```

Dependencies only point down: `ipc → use-cases → service (state) → domain/db/utils → libraries`.
Background jobs the service runs on its queue (e.g. `scan-sources.use-case.ts`) are use cases too,
but must not import the service, so there are no cycles; the service imports them directly, not
through `use-cases/index.ts`. Lower layers never import `electron`'s `ipcMain`/`BrowserWindow` or a
higher layer. Libraries (`src/main/git`, `src/main/sqlite`) never import a feature.

### `ipc.ts`: communication only

- One `init<Feature>Ipc()` that registers handlers; `src/main/index.ts` calls it.
- Each handler validates/coerces its arguments and calls **one** use case (or the service's
  `getSnapshot`). No business logic, no module-level `let` state, no SQL, no child processes.
- Window-specific UI (e.g. `dialog.showOpenDialog`) is allowed here because it needs the
  sender's window.
- Push events: subscribe to the service and forward to `BrowserWindow.getAllWindows()`.

```ts
ipcMain.handle(LocalReposChannel.RemoveSource, (_, id: string) => removeSource(String(id)))
subscribe((snapshot) => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(LocalReposChannel.Changed, snapshot)
  }
})
```

### `use-cases/`: business rules

- One file per user action or background job, named `<action>.use-case.ts` (e.g.
  `add-sources.use-case.ts`, `remove-source.use-case.ts`, `scan-sources.use-case.ts`), exporting
  one function. `index.ts` re-exports them all.
- A use case decides _what_ happens (e.g. "removing a source deletes repos nothing covers") and
  calls the DB API, domain code and the service. When several writes must happen together it wraps
  them in `db.transaction(() => …)`.
- User actions return the new snapshot for the UI.

### `<name>-service.ts`: runtime state

- Owns mutable state (job queue, in-flight counters, progress, throttling, watchers, last-run
  times) and exposes it as plain functions (`getSnapshot`, `subscribe(listener) → unsubscribe`,
  `notify`, `enqueue`, `start<Name>Service()`). Knows nothing about IPC or windows.
- Holds no business rules: the jobs it runs are use cases.
- Returns a whole snapshot that the UI can render directly, instead of many small getters.

### Domain folders: the work

- Feature-specific work split by concern: e.g. `scanner/` (filesystem walk), `watcher/`
  (`fs.watch` handles + pure rules for what a change means).
- Multi-step pipelines get one file per step plus an entry file
  (`discover.ts → scan-source.ts → inspect.ts`).

### Libraries: code more than one feature can use

- Live in `src/main/<library>/` with an `index.ts` public API and a `README.md`. No IPC, no
  state, no feature types; features map results to their own types.
- Talking to a process or API: separate **I/O** from **parsing**. `run.ts` executes the
  command/request, `parsers/<topic>.ts` holds pure functions that turn raw output into typed data,
  `queries/<topic>.ts` combines them into typed questions (`readStatus(dir)`, `listWorktrees(dir)`).
  Exactly one place spawns a given process or calls a given API.
- Types the renderer also sees go in `src/shared/<library>/types.ts`; main-only types stay in the
  library's `types.ts`.
- Current libraries: [`src/main/git`](../src/main/git/README.md) (git CLI) and
  [`src/main/sqlite`](../src/main/sqlite/README.md) (opening feature DBs, JSON columns).

### `db/`: SQLite persistence

- Database: `better-sqlite3` wrapped with **Drizzle ORM**, file `~/.devflow/<feature>.db`, opened in
  `db/connection.ts` with `openDatabase(name, { schema, createTablesSql })` from `src/main/sqlite`
  (`export const { getDb, resetDb, transaction } = openDatabase(…)`). It sets the pragmas (`foreign_keys = ON`),
  runs the generated `CREATE TABLE IF NOT EXISTS` script and closes on `before-quit`.
- No migrations or schema versions: after changing a table, run `npm run db:generate` (writes
  `db/create-tables.generated.ts` via `drizzle-kit export`), then Reset local data.
- `tables/<table-name>/`: **one folder per table**, named after the table (kebab-case), with:
  1. `schema.ts`: the Drizzle table (`sqliteTable('<table_name>', { camelCase: type('snake_case') })`)
     and `export type <Name>DbEntity = typeof <table>.$inferSelect`. Booleans use
     `integer(…, { mode: 'boolean' })` and nested objects `text(…, { mode: 'json' }).$type<T>()`,
     so rows come back in app shape and need no mapper. Every column gets a `/** */` comment saying
     what it means and where the value comes from.
  2. `queries.ts`: the table's reads and writes in app types (e.g. `listRepos()`, `saveRepo(repo)`).
     They call `getDb()` themselves; a write that spans tables (a repo and its worktrees) wraps
     itself in `transaction`. No business rules: those are in use cases.
     Relations between tables go in `tables/relations.ts`. `connection.ts` imports only `schema.ts`
     files, never `queries.ts`, so there are no import cycles.
- There is no `db/index.ts`: use cases import `db/tables/<table>/queries.ts` and, to group writes
  or reset, `transaction`/`resetDb` from `db/connection.ts`.
- **Document the database** in `db/tables/README.md`, next to the table files (example:
  `src/main/local-repos/db/tables/README.md`), and list it in `docs/README.md`:
  - what one row of each table represents and which flow creates/updates/deletes it
  - a JSON example row per table
  - a mermaid `erDiagram` of the tables, with a comment on every column saying what it stores
    (e.g. `INTEGER is_bare "1 = bare repo: only the git database, no checked-out files"`)
  - a mermaid `flowchart` of the flow that writes them
  - a scenarios table: each real situation (plain clone, worktree outside the folder, overlapping
    folders, deleted repo…) and the rows it leaves in each table, checked by running the code
    Update it in the same change whenever a table, column or write flow changes.

## File conventions

- Docs live next to the code they describe (`README.md` in that folder). `docs/` only holds
  cross-cutting guides and the index (`docs/README.md`).

- Every file starts with a short `/** … */` summary: what it does and, if it isn't obvious, why it
  exists. Keep it to 1–5 lines.
- Name things after the domain, not the mechanism or an old concept (`local-repos`, `source`,
  not `worktrees`, `root`). Use one term per concept across main, shared, renderer, SQL and
  channel names.
- Prefer several small focused files over one large file. Split a file when it holds more than
  one of: IPC, state, I/O, parsing, SQL.
- Spawn processes with `execFile` (no shell) and a timeout. For git, set `GIT_OPTIONAL_LOCKS=0`
  and `GIT_TERMINAL_PROMPT=0`.
- Secrets/tokens stay in main (e.g. `safeStorage`), never in the renderer or Firestore.

## Renderer side

- `src/renderer/src/features/<feature>/hooks/use<Thing>.ts`: invoke `GetSnapshot` once,
  subscribe to the `Changed` channel, expose actions.
- Map shared domain types to UI view-models in a separate file
  (e.g. `features/github/local-repositories.ts`), not inside components.
- Keep mock fixtures when switching to live data. Stop importing them; don't delete them.

## Before pushing

```bash
npx prettier --write <changed files>
npx eslint <changed files>
npm run typecheck        # typecheck:node + typecheck:web
```

Pure parsers and DB code can be exercised from Node with `npx tsx` by stubbing `electron`.
