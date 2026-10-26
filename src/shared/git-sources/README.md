# Shared Git source contract

| File          | Purpose                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`    | `GitSourceProvider`, account, repo, favorite, public device instructions, snapshot, repo page, `CheckoutRequest` and `CheckoutPlan`          |
| `channels.ts` | `GitSourcesChannel`: snapshot, connect, complete, cancel, list, favorite, refresh, disconnect, prepare/create checkout, open-url and changed |

Flow: `main/ipc → existing electron preload IPC bridge → renderer/useGitSources`. `CheckoutRequest.repo` accepts `local`, `remote` or `url` targets. URL targets carry only a user-pasted repo root, never a token; validation and canonical identity matching happen in main. No new generic invoke bridge is added: the app already exposes Electron Toolkit IPC. DB row fields match shared camelCase fields and are selected as-is. Main-only adapter types contain device codes/tokens; shared contracts never do.
