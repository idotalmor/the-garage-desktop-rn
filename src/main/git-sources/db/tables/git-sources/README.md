# Connected accounts

| File         | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| `schema.ts`  | `git_sources`, `GitSourceDbEntity`, provider user facts   |
| `queries.ts` | `listSources`, `findSource`, `saveSource`, `deleteSource` |

Flow: `completeConnection → saveSource → transaction(account upsert + credentials.saveCredential)`; `disconnect → deleteSource → FK cascades`. `listSources` is safe for snapshots: it never joins credentials. Stable provider user ids preserve account identity across login renames.
