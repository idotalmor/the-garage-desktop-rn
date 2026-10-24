# Local repos (`src/main/local-repos`)

Finds git repos and worktrees in the folders the user adds (sources), stores them in SQLite
(`~/.devflow/local-repos.db`) and keeps them up to date while the app runs. The renderer gets one
`LocalReposSnapshot` (`src/shared/local-repos/types.ts`) over IPC.

```
ipc.ts        IPC handlers → one use case each; pushes snapshots to every window
use-cases/    business rules: user actions + background jobs        → use-cases/README.md
sync/         runtime: job queue, live file watching, UI snapshot     → sync/README.md
scanner/      reads repos from disk with git (never touches the DB)   → scanner/README.md
watcher/      fs.watch handles + rules for what a file change means   → watcher/README.md
db/           Drizzle tables and their reads/writes                   → db/README.md
utils/        pure helpers shared by use cases and the watcher        → utils/README.md
```

Dependencies point down: `ipc → use-cases → sync → scanner / watcher / db → src/main/git, src/main/sqlite`.

## Main call chains

**User adds a folder** (+ next to the source chips):
`ipc.ts` (folder picker) → `use-cases/add-sources.use-case.ts addSources` → `db/tables/sources/queries.ts insertSources`
→ `sync/job-queue.ts enqueueScan` → `use-cases/scan-sources.use-case.ts scanSources` → `scanner/index.ts scanSource`
→ `db/tables/local-repos/queries.ts saveRepo` → job done → `sync/live-sync.ts syncWatching` + `sync/snapshot.ts notify` → `ipc.ts` sends `local-repos:changed`.

**A file changes in a watched folder**:
`watcher/fs-watchers.ts` → `sync/live-sync.ts onPathChanged` → `watcher/watch-targets.ts classifyChange`
→ (batched 1s/5s) → `sync/job-queue.ts enqueue` → `use-cases/refresh-repos.use-case.ts refreshRepos` (one repo) or `scanSources` (quiet rescan of a source) → `notify`.

**User removes a source / resets / reorders**: `ipc.ts` → `remove-source` / `reset-local-data` / `set-repo-order` use case → queries → `notify`.

**User opens or deletes a checkout** (card footer): `ipc.ts` → `open-ide` (`open -a`), `open-folder` (`shell.openPath`) or `delete-worktree` (`shell.trashItem` → `worktree prune` → `enqueue(refreshRepos)`).

**User opens a card's commit history** (commit button or last-commit line): `ipc.ts` →
`use-cases/list-commits.use-case.ts listCommits` → `db/tables/local-repos/queries.ts findRepo` → `src/main/git listCommits`
→ one `CommitPage`; the renderer asks again with `next` as the user scrolls.

**User pulls a checkout** (↓N chip on a card): `ipc.ts` → `use-cases/pull-worktree.use-case.ts pullWorktree` →
`src/main/git pull` → `utils/pull-hints.ts pullHint` on failure → `enqueue(refreshRepos)` → `notify`.

**Startup**: `ipc.ts initLocalReposIpc` → `sync/index.ts startSync` (watchers, initial full scan, rescan on window focus).
