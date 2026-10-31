# App updates (`src/main/app-updates`)

Keeps installed apps up to date from GitHub Releases, without an Apple Developer ID:

- **JS bundle** (UI-only change): CI attaches a signed `bundle-<version>.tar.gz` to the installed
  app's release. The app downloads it in the background, the top bar shows **Update**, and pressing
  it (or the next launch) reloads every window from `~/.devflow/app-updates/bundles/<build>/`.
- **New base** (native change: Electron, main/preload code, packages they load, packaging config):
  CI publishes a new release with a `.dmg`. The top bar shows **New version**, which opens the
  release page; the user installs the `.dmg` by hand. (Squirrel auto-install needs Developer ID
  signing, so `electron-updater` is not used yet.)

How CI decides and publishes: [scripts/release](../../../scripts/release/README.md).

Only the renderer is ever replaced. Main and preload always come from the installed app, which is
why a change to them needs a new base. A bundle only runs on the exact app version it was built for.

## Safety

- The manifest is signed with ed25519 (`BUNDLE_SIGNING_KEY` in CI); the app has the public key built
  in (`MAIN_VITE_BUNDLE_PUBLIC_KEY`) and checks it, then the tarball's size + sha256.
- A bundle's first load is watched: if the UI doesn't send `Ready` within 15 s after the page
  loaded, fails to load, or its renderer crashes, it is marked `bad`, deleted, never downloaded
  again, and the windows go back to the previous bundle (or the UI inside the app).
- Updates are off in dev and in builds without the public key (`updatesEnabled()`).

## Folders

| Folder / file | What it is                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `ipc.ts`      | `initAppUpdatesIpc()`: snapshot, check, reload, open download, `Ready` reports, `Changed` pushes |
| `windows.ts`  | `loadRenderer(window, query)` for every app window, reloads on bundle change, first-load watch   |
| `use-cases/`  | [Business rules](use-cases/README.md): choose / download / confirm / reject / prune bundles      |
| `sync/`       | [Runtime state](sync/README.md): running bundle, periodic check, snapshot                        |
| `releases/`   | [GitHub Releases](releases/README.md): `base.json`, signed manifest, download + verify + unpack  |
| `db/`         | [SQLite](db/README.md) `~/.devflow/app-updates.db`: the `bundles` table                          |
| `utils/`      | [Settings and version helpers](utils/README.md)                                                  |

## Call chains

- **Startup**: `index.ts → initAppUpdatesIpc → sync.startUpdates → pruneBundles + chooseBundle →
setRunning`; then `main-window.ts` / `popover.ts → windows.loadRenderer` loads that bundle.
- **Check** (10 s after start, every 30 min, or `Check` IPC): `sync/checker.runCheck →
findNewBase` (latest `base.json`) `+ downloadNewBundle` (manifest → `releases.downloadBundle` →
  `bundles` row `downloaded`) → snapshot `readyBundle` / `newBase` → `Changed` push → **Update** /
  **New version** chip.
- **Update**: `Reload` IPC → `applyReadyBundle → setRunning` → `onRunningChanged →
windows.reloadRendererWindows` → first-load watch → renderer `useReportReady` → `Ready` IPC →
  `windows.onRendererReady → confirmBundle` (row `confirmed`, older bundles pruned).
- **Bad bundle**: watch fails → `rejectBundle` (row `bad`, folder deleted) → `setRunning(chooseBundle())`
  → windows reload into the previous bundle.
- **New version**: `OpenBaseDownload` IPC → `openBaseDownload → shell.openExternal(release page)`.
- **After installing a new .dmg**: next startup `pruneBundles` deletes bundles of the old version.

## Checking it locally

`DEVFLOW_RELEASES_URL` points the app at another server with the same paths as GitHub
(`/latest/download/<asset>`, `/download/v<version>/<asset>`). The scenarios in
[db/tables/README.md](db/tables/README.md) were run that way: the real main code in Electron, a fake
release server, and releases made with `scripts/release/`.
