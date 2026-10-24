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
  sync/               runtime state only (job queue, progress, watchers, snapshot/subscriptions); index.ts = API
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
  utils/              small pure helpers with no feature state (e.g. path rules)

src/main/<library>/   code shared by features, with no IPC and no state: e.g.
  git/                typed git CLI questions (run.ts, parsers/, queries/, index.ts)
  sqlite/             openDatabase → { getDb, resetDb, transaction } (better-sqlite3 + Drizzle)
src/shared/<library>/ types from a library that the renderer also sees (e.g. shared/git/types.ts)
```

Dependencies only point down: `ipc → use-cases → sync (state) → domain/db/utils → libraries`.
Background jobs `sync/` runs on its queue (e.g. `scan-sources.use-case.ts`) are use cases too,
but must not import `sync/`, so there are no cycles; `sync/` imports them directly, not
through `use-cases/index.ts`. Lower layers never import `electron`'s `ipcMain`/`BrowserWindow` or a
higher layer. Libraries (`src/main/git`, `src/main/sqlite`) never import a feature.

### `ipc.ts`: communication only

- One `init<Feature>Ipc()` that registers handlers; `src/main/index.ts` calls it.
- Each handler validates/coerces its arguments and calls **one** use case (or `sync`'s
  `getSnapshot`). No business logic, no module-level `let` state, no SQL, no child processes.
- Window-specific UI (e.g. `dialog.showOpenDialog`) is allowed here because it needs the
  sender's window.
- Push events: subscribe to `sync` and forward to `BrowserWindow.getAllWindows()`.

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
  calls the table `queries.ts` functions, domain code and `sync/`. When several writes must
  happen together it wraps them in `transaction(() => …)` from `db/connection.ts`. Never `await`
  inside a transaction (`better-sqlite3` is synchronous and rejects async callbacks).
- Values that are derived rather than stored (e.g. which sources cover a repo) are computed here,
  from small pure helpers, not added to the shared types.
- User actions return the new snapshot for the UI.

### `sync/`: runtime state

- Owns mutable state, one concern per file (`job-queue.ts`, `live-sync.ts`, `snapshot.ts`), and
  exposes it from `index.ts` as plain functions (`getSnapshot`, `subscribe(listener) → unsubscribe`,
  `notify`, `enqueue`, `startSync()`). Knows nothing about IPC or windows. Files don't import each
  other in a cycle: lower files emit events and `index.ts` wires them.
- Holds no business rules: the jobs it runs are use cases.
- Returns a whole snapshot that the UI can render directly, instead of many small getters.

### Domain folders: the work

- Feature-specific work split by concern: e.g. `scanner/` (filesystem walk), `watcher/`
  (`fs.watch` handles + pure rules for what a change means).
- A domain folder's public API is its `index.ts` (e.g. `scanner/index.ts`: `scanSource`,
  `rereadRepo`); other folders import only that. Multi-step pipelines get one internal file per
  step (`find-repo-folders.ts → read-repo.ts`), and helpers used only by that folder live in it
  (`scanner/concurrency.ts`).
- Runtime plumbing uses small well-known packages instead of hand-written code: `p-queue` for the
  job queue, `lodash.debounce` (`maxWait`) for batching file changes, Node's `EventEmitter` for
  subscribers.

### Libraries: code more than one feature can use

- Live in `src/main/<library>/` with an `index.ts` public API and a `README.md`. No IPC, no
  state, no feature types; features map results to their own types.
- Talking to a process or API: separate **I/O** from **parsing**. `run.ts` executes the
  command/request, `parsers/<topic>.ts` holds pure functions that turn raw output into typed data,
  `queries/<topic>.ts` combines them into typed questions (`readStatus(dir)`, `listWorktrees(dir)`).
  Exactly one place spawns a given process or calls a given API.
- Types the renderer also sees go in `src/shared/<library>/types.ts`; main-only types stay in the
  library's `types.ts`.
- Current libraries: [`src/main/git`](../src/main/git/README.md) (git CLI: `run.ts`, `parsers/`,
  `queries/`, `types.ts`, `index.ts`) and [`src/main/sqlite`](../src/main/sqlite/README.md)
  (`openDatabase` for a feature DB with Drizzle).

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
     They call `getDb()` themselves (always the same single connection, so calls made inside a
     `transaction` are part of it); a write that spans tables (a repo and its worktrees) wraps
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

## Creating a new feature (checklist)

Copy the shape of `src/main/local-repos/` (read its [README](../src/main/local-repos/README.md) first).

1. **Name it** after the domain, kebab-case (`<feature>`), one word per concept everywhere
   (main, shared, renderer, SQL, channels). Agree on names before writing code.
2. **Contract** in `src/shared/<feature>/`: `types.ts` (what the renderer receives, every field
   commented, field names = Drizzle column names in camelCase) and `channels.ts`
   (`<Feature>Channel`, `'<feature>:<action>'`, one comment each, plus a `Changed` push channel).
3. **DB** (if it stores data) in `src/main/<feature>/db/`:
   - `tables/<table>/schema.ts`: Drizzle `sqliteTable`, every column commented (meaning + where the
     value comes from), `export type <Name>DbEntity = typeof <table>.$inferSelect`.
   - `tables/<table>/queries.ts`: reads/writes in app types, calling `getDb()`; `tables/relations.ts`
     if tables link.
   - `schema.ts` re-exporting tables + relations, `drizzle.config.ts`, add the config to
     `scripts/generate-db-schema.mjs`, run `npm run db:generate`.
   - `connection.ts`: `export const { getDb, resetDb, transaction } = openDatabase('<feature>', …)`.
   - `tables/README.md` (purposes, JSON example rows, commented ER diagram, write flow, verified
     scenarios) and `db/README.md` (files + queries).
   - Store every fact you read from the source system; don't store values you invent or can
     compute. No migrations: after a schema change, regenerate and Reset.
4. **Domain folders** for the actual work (e.g. `scanner/`, `watcher/`, `api/`), each with an
   `index.ts` public API and internal step files. Reusable code with no feature types goes in a
   library (`src/main/<library>/`, e.g. `git`, `sqlite`) instead.
5. **Use cases** in `use-cases/<action>.use-case.ts`, one exported function each, plus `index.ts`.
   All business rules live here; group writes with `transaction` (no `await` inside).
6. **Runtime state** (only if needed: queues, watchers, timers, subscribers) in `sync/` or a
   similarly named folder, one concern per file, `index.ts` as API and `start…()` to wire it.
   Prefer small well-known packages (`p-queue`, `lodash.debounce`, `EventEmitter`).
7. **IPC** in `ipc.ts`: `init<Feature>Ipc()` (called from `src/main/index.ts`), each handler calls
   one use case; forward snapshots to all windows. Expose it in `src/preload` if needed.
8. **Renderer**: `features/<feature>/hooks/use<Thing>.ts` (get snapshot + subscribe), a separate
   mapper file to UI view models, components. Keep existing mock fixtures (stop importing them).
9. **Docs**: a `README.md` in every folder of the feature (what it does, file table, call chain
   with file names), all listed in `docs/README.md`; a summary comment atop every file.
10. **Check**: Prettier, ESLint, `npm run typecheck`, and run the main-process code from Node
    against real data (see "Before pushing") to verify the scenarios table.

## File conventions

- Docs live next to the code they describe (`README.md` in that folder). Every folder of a feature
  gets one: what it does, a table of its files, and the call chain with file names. `docs/` only holds
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
npm run db:generate      # only after changing a Drizzle table
```

Main-process code (scanner, use cases, DB, `sync` with real watchers) can run from Node
against real git repos: bundle a small script with `esbuild --bundle --platform=node
--alias:electron=./electron-stub.ts --external:better-sqlite3` (the stub only needs
`app.getPath('home')` and `app.on`), set `HOME` to a temp folder, and run it with
`NODE_PATH=<repo>/node_modules`. Use this to check the DB README's scenarios table after changing a
write flow, and assert there are no duplicate rows.
