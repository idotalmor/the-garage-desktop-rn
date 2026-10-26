# Provider adapters

| File/folder | Purpose                                                            |
| ----------- | ------------------------------------------------------------------ |
| `types.ts`  | `GitSourceAdapter`, main-only device-code and credential contracts |
| `index.ts`  | `getProvider(provider)` dispatch, rejecting unsupported providers  |
| `github/`   | GitHub.com device authorization and REST adapter                   |

Flow: `use-cases → index.ts getProvider → adapter.begin/authorize/account/listRepos/readRepo`. Adapters return shared neutral types, never store data. Add future providers here and extend the shared provider union, without adding provider conditions to renderer components or generic use cases.
