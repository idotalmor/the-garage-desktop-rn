# App updates UI (`features/app-updates`)

| File                           | What it is                                                                  |
| ------------------------------ | --------------------------------------------------------------------------- |
| `hooks/use-app-updates.ts`     | `GetSnapshot` once + `Changed` pushes; `reload`, `openBaseDownload` actions |
| `hooks/use-report-ready.ts`    | Sends `Ready` after the first render (confirms a bundle on its first run)   |
| `update-status.ts`             | `updateAction(snapshot)`: which chip to show (`reload` / `download` / none) |
| `components/UpdateControl.tsx` | The top-bar chip, next to the recording control                             |

Flow: `App → useReportReady → Ready IPC → windows.onRendererReady → confirmBundle`;
`AppShell → UpdateControl → useAppUpdates → updateAction` → **Update** (`Reload` IPC →
`applyReadyBundle` → every window reloads from the new bundle) or **New version** (`OpenBaseDownload`
IPC → GitHub release page). Main side: [src/main/app-updates](../../../../main/app-updates/README.md).
