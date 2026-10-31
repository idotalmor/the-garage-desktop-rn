# App updates contract (`src/shared/app-updates`)

| File          | What it is                                                                      |
| ------------- | ------------------------------------------------------------------------------- |
| `types.ts`    | `AppUpdatesSnapshot` (running versions, `readyBundle`, `newBase`, check status) |
| `channels.ts` | `AppUpdatesChannel`: snapshot, check, reload, open download, ready, changed     |

Main side: [src/main/app-updates](../../main/app-updates/README.md).
