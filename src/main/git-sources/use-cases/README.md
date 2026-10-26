# Git source use cases

| File / exported action                                                     | Rule / dependencies                                                                                                                       |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `open-url.use-case.ts` / `openUrl(url)`                                    | Validate HTTPS GitHub host, reject credentials/other protocols, call `shell.openExternal`; no app popup or DB writes                      |
| `connect.use-case.ts` / `connect()`                                        | Require secure storage, replace pending flow, begin authorization and open verified browser URL                                           |
| `complete-connection.use-case.ts` / `completeConnection()`                 | Share one pipeline across windows; authorize → read account → encrypt → atomically save account/token; always clear current pending state |
| `cancel-connection.use-case.ts` / `cancelConnection()`                     | Abort pending authorization, retain connected accounts                                                                                    |
| `list-repos.use-case.ts` / `listRepos(sourceId, page)`                     | Validate page, fetch one page, reject stale disconnected/reconnected responses before cache writes                                        |
| `set-favorite.use-case.ts` / `setFavorite(sourceId, externalId, favorite)` | Only a cached accessible repo can be selected; local visibility is unaffected                                                             |
| `refresh.use-case.ts` / `refresh(sourceId)`                                | Read favorites and local GitHub primary remotes, fetch individual repos, save only a complete successful refresh                          |
| `disconnect.use-case.ts` / `disconnect(sourceId)`                          | Remove account with cascading credential/cache/favorite deletion, never touch local clones                                                |
| `prepare-checkout.use-case.ts` / `prepareCheckout(request)`                | Resolve known repo, validate branch, prefer reusing a local clone, suggest safe sibling parent                                            |
| `create-checkout.use-case.ts` / `createCheckout(request, parent)`          | Re-plan, reserve destination, clone/add worktree, register or rescan local data                                                           |
| `index.ts`                                                                 | Public action exports                                                                                                                     |

Flow: `ipc.ts → action → providers/credentials/db queries → sync.notify`. Async network operations run outside SQLite transactions. `saveSource` groups account/token writes; `saveRepos` groups cache upserts. Page and refresh actions compare encrypted credential identity after I/O to prevent stale writes following disconnect/reconnect.
