# Use cases (`use-cases/`)

The business rules: one file per user action or background job, `<action>.use-case.ts`, one
exported function. They call `db/tables/*/queries.ts`, `scanner/` and `sync/`, and group writes
with `transaction` from `db/connection.ts` (never with an `await` inside). `index.ts` re-exports them.

| File                           | Called by                                | What it does                                                                                                                                                                                                      |
| ------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add-sources.use-case.ts`      | `ipc.ts` (+)                             | Resolves symlinks, inserts new sources, `enqueueScan` for them                                                                                                                                                    |
| `remove-source.use-case.ts`    | `ipc.ts` (× on a chip)                   | Deletes the source and every repo no remaining source covers; re-points the watchers                                                                                                                              |
| `rescan.use-case.ts`           | `ipc.ts`                                 | Full scan of one source or all                                                                                                                                                                                    |
| `reset-local-data.use-case.ts` | `ipc.ts` (trash)                         | Cancels pending changes, then `resetDb()` on the queue                                                                                                                                                            |
| `set-repo-order.use-case.ts`   | `ipc.ts` (sort / drag)                   | `saveRepoPositions(ids)`                                                                                                                                                                                          |
| `open-ide.use-case.ts`         | `ipc.ts` (IDE picker on a card)          | `open -a <IDE> <checkout path>` (Cursor, VS Code, Terminal)                                                                                                                                                       |
| `open-folder.use-case.ts`      | `ipc.ts` (Finder button on a card)       | `shell.openPath(checkout path)` — opens the folder in Finder                                                                                                                                                      |
| `delete-worktree.use-case.ts`  | `ipc.ts` (delete button on a card)       | `shell.trashItem` the checkout folder, `worktree prune` the shared git dir, `enqueue(refreshRepos)`; remote-branch deletion is a no-op for now                                                                    |
| `scan-sources.use-case.ts`     | `sync/job-queue.ts`, `sync/live-sync.ts` | For each source: `scanSource` → in one transaction save found repos, mark the source scanned, delete repos it covers but didn't find (unless another source covers them). Then delete repos whose git dir is gone |
| `refresh-repos.use-case.ts`    | `sync/live-sync.ts`                      | `rereadRepo` each changed repo; bump `updatedAt` if a checkout changed; save it, delete repos that are gone or no longer covered                                                                                  |

User actions return the new snapshot. Jobs don't import `sync/`, so there are no import cycles.
