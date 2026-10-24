# Sync (`sync/`)

Local repos at runtime. Makes sure only one job runs at a time, whoever starts it, keeps the
watchers pointed at the current sources and repos, and pushes snapshots to the UI. It holds state
but no business rules: the jobs it runs are use cases. Import only from `sync/index.ts`.

| File           | What it does                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`     | `startSync()` wires everything at startup; re-exports `getSnapshot`, `subscribe`, `notify`, `enqueue`, `enqueueScan`, `syncWatching`, `cancelPendingChanges`                          |
| `job-queue.ts` | `p-queue` with concurrency 1; scanning/progress status; `enqueueScan`; `rescanIfStale` (on window focus, at most every 5 min). Emits `status` and `done`                              |
| `live-sync.ts` | `syncWatching` points `watcher/` at sources + repos; `onPathChanged` collects changes, `lodash.debounce` (1s quiet, 5s max) flushes them as `refreshRepos` / quiet `scanSources` jobs |
| `snapshot.ts`  | `getSnapshot` (sources, repos, scan status) and `subscribe`/`notify` (`EventEmitter`)                                                                                                 |

## Call chain

```
startSync()                                   index.ts
├─ onQueueEvent('status') → notify            job-queue.ts → snapshot.ts
├─ onQueueEvent('done')   → syncWatching + notify
├─ app 'browser-window-focus' → rescanIfStale → enqueueScan
├─ syncWatching() → watchTargets → syncWatchers(…, onPathChanged)     live-sync.ts → watcher/
└─ enqueueScan() → enqueue(scanSources)        job-queue.ts → use-cases/

file event → onPathChanged → classifyChange → flushChangesSoon (debounce)
          → flushChanges → enqueue(refreshRepos | scanSources)          live-sync.ts → job-queue.ts
```

The modules never import each other in a cycle: `job-queue` only emits events and `index.ts`
connects them to `notify` and `syncWatching`.
