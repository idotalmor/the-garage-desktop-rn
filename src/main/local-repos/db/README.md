# DB (`db/`)

`~/.devflow/local-repos.db`, `better-sqlite3` + Drizzle. Tables, columns, example rows, diagrams
and scenarios: [tables/README.md](tables/README.md).

| File                                               | What it is                                                                                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connection.ts`                                    | `getDb`, `resetDb`, `transaction` (from `src/main/sqlite` `openDatabase`) and the `LocalReposDb` type                                                       |
| `schema.ts`                                        | Re-exports every table and relation (for Drizzle and `drizzle-kit`)                                                                                         |
| `drizzle.config.ts` / `create-tables.generated.ts` | `npm run db:generate` writes the `CREATE TABLE IF NOT EXISTS` script from the tables. No migrations: after a schema change, regenerate and Reset local data |
| `tables/<table>/schema.ts`                         | The Drizzle table (every column commented) and its `<Name>DbEntity` type                                                                                    |
| `tables/<table>/queries.ts`                        | Reads/writes in app types; only use cases (and `sync/snapshot.ts`, `sync/live-sync.ts` for reads) call them                                                 |
| `tables/relations.ts`                              | `local_repos` has many `local_worktrees` (for `listRepos`)                                                                                                  |

Queries: `sources` → `listSources`, `insertSources`, `deleteSource`, `markSourceScanned`;
`local-repos` → `listRepos`, `hasRepo`, `saveRepo` (repo + worktrees in one transaction), `deleteRepos`, `saveRepoPositions`;
`local-worktrees` → `replaceRepoWorktrees`.
