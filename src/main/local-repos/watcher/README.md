# Watcher (`watcher/`)

Low-level file watching for `sync/live-sync.ts`.

| File               | What it does                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fs-watchers.ts`   | The only place that calls `fs.watch` (recursive; FSEvents on macOS). `syncWatchers(paths, onChange)` opens/closes handles to match `paths`; `closeAllWatchers` on quit                                                                                                                                                                              |
| `watch-targets.ts` | Pure rules. `watchTargets(sources, repos)`: every source, plus repo git dirs and checkouts outside all sources. `classifyChange(path, …)`: `repo` (inside a known checkout or git dir), `source` (could be a new/deleted clone, within `max_depth`), or ignored (`node_modules`, build dirs, `.git/objects`, `.git/logs`, `*.lock`, hidden folders) |

Call chain: `syncWatching` (sync) → `watchTargets` → `syncWatchers` → `fs.watch` → `onPathChanged` (sync) → `classifyChange`.
