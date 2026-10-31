# Sync (`app-updates/sync`)

Runtime state only; the rules are in [use-cases](../use-cases/README.md).

| File          | What it is                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------ |
| `state.ts`    | The running bundle (`getRunning` / `setRunning`) and the last check (`CheckState`); events |
| `checker.ts`  | `runCheck()`: `findNewBase` + `downloadNewBundle` together, one at a time; `startChecks()` |
| `snapshot.ts` | `getSnapshot()` (`AppUpdatesSnapshot`), `subscribe`, `notify`                              |
| `index.ts`    | API + `startUpdates()` (prune, choose bundle, start checks) and `onRunningChanged`         |

`state` emits `running` when the windows must load another bundle (`ipc.ts` wires it to
`windows.reloadRendererWindows`) and `changed` on every change (`index.ts` wires it to `notify`).
A check failing (offline, bad signature) only sets `lastError`; the other job's result still counts.
