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
  ipc.ts              communication only
  <name>-service.ts   state + orchestration (queues, progress, timers, subscriptions)
  <domain>/           the actual work, split by concern (e.g. scanner/, git/, http/)
  db/                 SQLite persistence (only if the feature stores data)
    connection.ts
    index.ts
    tables/<table>.ts
  utils/              small pure helpers with no feature state (parsing, concurrency, formatting)
```

Dependencies only point down: `ipc → service → domain/db/utils`. Lower layers never import
`electron`'s `ipcMain`/`BrowserWindow` or a higher layer.

### `ipc.ts`: communication only

- One `init<Feature>Ipc()` that registers handlers; `src/main/index.ts` calls it.
- Each handler validates/coerces its arguments and calls **one** service function. No business
  logic, no module-level `let` state, no SQL, no child processes.
- Window-specific UI (e.g. `dialog.showOpenDialog`) is allowed here because it needs the
  sender's window.
- Push events: subscribe to the service and forward to `BrowserWindow.getAllWindows()`.

```ts
ipcMain.handle(LocalReposChannel.Rescan, (_, id?: string) => rescan(id ? String(id) : undefined))
subscribe((snapshot) => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(LocalReposChannel.Changed, snapshot)
  }
})
```

### `<name>-service.ts`: state and orchestration

- Owns mutable state (queues, in-flight counters, progress, throttling, last-run times).
- Exposes plain functions (`getSnapshot`, `rescan`, `subscribe(listener) → unsubscribe`,
  `start<Name>Service()`). Knows nothing about IPC or windows.
- Returns a whole snapshot that the UI can render directly, instead of many small getters.

### Domain folders: the work

- Split by "what it talks to": e.g. `git/` (process), `scanner/` (filesystem walk), `http/` or
  `api/` (network).
- Separate **I/O** from **parsing**: `run.ts` executes the command/request, `parsers.ts` holds pure
  functions that turn raw output into typed data, `queries.ts` combines them into typed
  questions (`readStatus(dir)`, `listWorktrees(dir)`).
- Exactly one place spawns a given process or calls a given API.
- Multi-step pipelines get one file per step plus an entry file
  (`discover.ts → scan-folder.ts → inspect.ts`).

### `db/`: SQLite persistence

- Database file: `~/.devflow/<feature>.db` (via `app.getPath('home')`), `better-sqlite3`.
- `connection.ts`: opens the DB once (`getDb()`), sets pragmas (`foreign_keys = ON`), runs each
  table's `CREATE TABLE`, closes on `before-quit`.
- `tables/<table-name>.ts`: **one file per table**, file named after the table (kebab-case).
  Each contains, in this order:
  1. `export const <TABLE_NAME>_TABLE = '<table_name>'`
  2. `export type <Name>Row`: the row exactly as stored (snake_case, booleans `0|1`, JSON as
     `string`; comment non-obvious columns)
  3. `export const CREATE_<TABLE_NAME>_TABLE`: SQL using the const, plus its indexes
  4. row ↔ domain mappers (`to<Name>Row`, `to<Name>`)
  5. single-table queries that take `db: Database.Database` as the first argument
     Table files don't import `connection.ts`, so there are no import cycles.
- `index.ts`: the feature's public DB API. It calls `getDb()`, composes table functions, and wraps
  multi-table writes in `db.transaction(...)`. Services import `./db`, never `./db/tables/*`.
- Nested objects are JSON columns parsed with a safe `parseJson(value, fallback)`.

## File conventions

- Every file starts with a short `/** … */` summary: what it does and, if it isn't obvious, why it
  exists. Keep it to 1–5 lines.
- Name things after the domain, not the mechanism or an old concept (`local-repos`, `scanFolder`,
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
