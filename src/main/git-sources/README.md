# Git sources

Connected provider accounts, their cached repo catalog, and explicit app favorites. GitHub.com is the first adapter. Local scanning/worktrees remain owned by `local-repos`.

| File/folder    | Purpose                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| `ipc.ts`       | Validate IPC arguments, call one action, broadcast snapshots               |
| `use-cases/`   | Connection, catalog, favorites, refresh and disconnect business rules      |
| `providers/`   | Provider interface and dispatch; `github/` implements device flow and REST |
| `credentials/` | OS safeStorage encryption/decryption boundary                              |
| `sync/`        | Pending authorization, shared completion promise, snapshot events          |
| `db/`          | Drizzle-backed `~/.devflow/git-sources.db`                                 |
| `checkout/`    | Safe sibling placement and exclusive checkout directory reservation        |

Flow: `ipc.ts → use-cases/*.use-case.ts → providers/index.ts → providers/github/` and `db/tables/*/queries.ts → sync/notify → ipc.ts → renderer`.

## Browser links

Repo header/card icons, PR icons and the authorization-page button use `renderer/git-sources/open-url.ts → GitSourcesChannel.OpenUrl → ipc.ts → open-url.use-case.ts → shell.openExternal`. This is the same OS browser-opening API used by Connect, not `window.open` or Electron popup routing; it works independently of tray/normal/promoted-window configuration. Main accepts only HTTPS `github.com` URLs without credentials or nonstandard ports; malformed URLs and other hosts/protocols are rejected. No credentials or DB writes are involved. Main-process channel changes require restarting Electron, not just renderer hot reload.

The regression harness records calls to mocked `shell.openExternal`, checks repo/PR/device-page dispatch, verifies renderer IPC dispatch and rejects unsafe URLs before they reach the opener. OS browser launching still needs manual verification.

## Checkout actions

Cards without a local checkout offer **Clone** (first clone) or **Create worktree** (reuse a local clone). `prepare-checkout.use-case.ts` resolves local/cached repo ids or validated pasted GitHub URLs, matches their primary slug to local clones and suggests a safe sibling parent. IPC shows a native parent-folder picker; cancellation writes nothing. `create-checkout.use-case.ts` re-plans, validates the canonical parent, reserves a fresh directory and calls `main/git` clone/worktree commands. Cached URLs are restricted to the repo's HTTPS GitHub.com path; pasted URLs accept validated GitHub HTTPS/SSH repo roots without embedded credentials. SSH transport is preserved. Pasting does not require a connection or cached catalog entry; HTTPS uses a matching cached account or the sole connected account; otherwise it uses configured Git credentials (no guessing between multiple unmatched accounts). An existing checkout for a pasted URL's requested branch is reused instead of duplicated, and the panel reports the actual path. Authentication is passed through process-scoped Git configuration environment variables, never argv, clone URLs, `.git/config`, the renderer or disk credential helpers.

A first clone is registered through `local-repos.addSources`, then normal scanning creates the repo/worktree rows. A linked worktree triggers `local-repos.rescan`; Git discovers the new sibling through the existing common directory, with no extra source or repo row. UI updates use existing local-repo push events. Default-branch cards reuse any matching checkout, not just the original/main checkout. Unknown or detached branches are not invented; already-checked-out branches and existing destination folders are rejected without force/reset/prune. Partial failures are retained with an actionable path in the error.

See [checkout/README.md](checkout/README.md) for placement safety and verified scenarios. PR/CI data remains out of scope; mock PRs without real branch metadata do not get an invented checkout action.

## Setup

Register a GitHub OAuth App, enable **Device Flow**, set `MAIN_VITE_GITHUB_CLIENT_ID` in `.env`, and restart the app. Device flow needs no client secret, callback listener, or GitHub mobile app. The initial browser page may open before the desktop displays the code; the code stays visible in the panel. The OAuth App registration may require a callback field even though this flow does not use it.

Scopes: `repo read:org` to list accessible private/org repos. Classic OAuth `repo` is broad (includes write permissions); this implementation only makes read requests after authorization. Org policies/SSO may restrict visibility. No Firebase linking, GitHub star changes, PR fetching or CI fetching is performed. User-requested clones use the connected account's token for GitHub HTTPS authentication.

Tokens are encrypted with safeStorage before SQLite writes, never included in snapshots/logs or sent to the renderer. Insecure Linux `basic_text` storage is rejected. Disconnect is local: it removes the account, encrypted token, cached repos and favorites; it does **not** revoke the OAuth grant on GitHub. Revoke it in GitHub settings if desired.

Catalog browsing is explicit and paginated (100/page). Startup reads cached data without enumerating repos. Refresh reads only favorites and GitHub primary remotes of local repos, sequentially; a failed refresh keeps the prior cache. Revoked credentials show a reconnect error while retaining cached cards. Use **Connect GitHub** to reconnect. No periodic polling except during device authorization.

Desktop membership is computed in the renderer: every local clone plus favorites without a matching local primary remote. Two clones remain separate. Multiple accounts exposing the same remote-only favorite produce one card. Unfavorite never hides local repos. Account switching is controlled in the browser; connection identity uses GitHub's stable user id.

Verification: `node scripts/check-git-sources.mjs`, `npm run db:generate`, `npm run typecheck`, `npm run lint`. Tests use a temporary home and mocked HTTP/keychain, never your real data. Real authorization requires the OAuth App configuration and OS keychain.
