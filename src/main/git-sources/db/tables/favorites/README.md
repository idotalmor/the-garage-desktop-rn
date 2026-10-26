# App favorites

| File         | Purpose                                                                          |
| ------------ | -------------------------------------------------------------------------------- |
| `schema.ts`  | `git_source_favorites`, composite FK to cached repo, `GitSourceFavoriteDbEntity` |
| `queries.ts` | `listFavorites`, idempotent `setFavorite` insert/delete                          |

Flow: `renderer Favorite → IPC → set-favorite use case → cached repo validation → queries.setFavorite → notify → renderer.mergeRepos`. This is an explicit user preference, not a provider fact or GitHub star. Unfavorite removes only the preference, never a repo or local worktree. Disconnect cascades deletion.
