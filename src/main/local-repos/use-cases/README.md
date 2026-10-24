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
| `scan-sources.use-case.ts`     | `sync/job-queue.ts`, `sync/live-sync.ts` | For each source: `scanSource` → in one transaction save found repos, mark the source scanned, delete repos it covers but didn't find (unless another source covers them). Then delete repos whose git dir is gone |
| `refresh-repos.use-case.ts`    | `sync/live-sync.ts`                      | `rereadRepo` each changed repo; bump `updatedAt` if a checkout changed; save it, delete repos that are gone or no longer covered                                                                                  |

User actions return the new snapshot. Jobs don't import `sync/`, so there are no import cycles.
