# Cached provider repos

| File         | Purpose                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| `schema.ts`  | `git_source_repos`, composite account/repo identity, `GitSourceRepoDbEntity` |
| `queries.ts` | `listRepos`, `findRepo`, transactional `saveRepos` upserts                   |

Flow: `listRepos/refresh use case → adapter → saveRepos → notify`. Cache records are facts, not desktop membership. Re-browsing a renamed repo updates its full name without breaking favorites. Failed network calls do not remove cache rows. Account deletion cascades to repo rows and their favorites.
