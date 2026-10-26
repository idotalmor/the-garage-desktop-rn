# Git sources implementation plan

## Scope and decisions

- GitHub.com first, behind a provider interface under `src/main/git-sources/providers/github/`.
- Device authorization: configure `MAIN_VITE_GITHUB_CLIENT_ID` and enable device flow on the GitHub OAuth App. No client secret or Firebase account linking.
- Tokens remain in main, encrypted with Electron safeStorage. Never send tokens over IPC.
- SQLite `git-sources.db` holds connected accounts, cached provider repo facts, and explicit favorites. Local paths/worktrees remain in `local-repos.db`.
- All accessible repos are available in a paginated picker; only local repos and favorites appear on the desktop. Favorites are app preferences, not GitHub stars.
- Match local clones by the primary remote's canonical slug, preserve separate local clone IDs and checkout actions, and avoid adding a duplicate remote-only card when a clone exists.
- Existing local card/history/actions remain intact. PR/CI fetching and Firestore sync are outside this connection-focused change.
- Support cloning a remote favorite or pasted GitHub HTTPS/SSH URL. Reuse matching clones and existing branch checkouts; new linked checkouts go beside existing ones, never inside them. Unknown locations use the native parent-folder picker. Successful clones register with local scanning.
- Keep connection/favorites/URL-clone controls in a settings panel toggled beside the Git heading, preserving draft state while hidden.
- Route GitHub repo/PR/authorization links through validated main-process `shell.openExternal` IPC, not Electron popup creation.

## Implementation order

1. Add commented shared contracts/channels and Drizzle tables for accounts, cached repos, and favorites; register schema generation.
2. Add provider-neutral interface and GitHub device authorization/API adapter, encrypted token storage, runtime authorization cancellation and snapshot notifications.
3. Add one use case per connect/begin, complete, cancel, refresh, list page, favorite, disconnect action; thin IPC handlers.
4. Add renderer subscription hook, pure local/provider mapper, and Gravity UI connection/repo picker above the desktop Git section.
5. Document each new folder and database write scenarios; index docs and write a signature-oriented PR review guide.
6. Verify formatting, lint, node/web typechecks, and executable tests for mapping, persistence and mocked GitHub device/API behavior. Real browser authorization needs the user's OAuth App configuration.

## Important behavior

- Authorization exposes only user code, verification URI, expiry and pending state to UI; device code stays in main.
- Respect pending/slow-down/expiry/denial responses, HTTP timeouts and one active flow. Disconnect/cancel invalidates in-flight work before it can save tokens.
- Fetch accessible repos on demand in bounded pages; refresh favorites separately so startup does not enumerate an account with thousands of repos.
- Persist only successful complete responses; errors retain cached data and are shown inline. No automatic network writes or GitHub star changes.
- Disconnect removes the account's cached metadata, encrypted token and favorites, leaving local repos untouched.
- Do not reset existing user data automatically. A new feature DB is created independently; schema reset is only needed if a pre-existing development copy differs.
