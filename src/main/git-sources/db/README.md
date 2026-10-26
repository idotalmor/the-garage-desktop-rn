# Git sources persistence

| File/folder                  | Purpose                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `connection.ts`              | Lazy `openDatabase('git-sources')`; `getDb/resetDb/transaction`, `GitSourcesDb` |
| `schema.ts`                  | Exports all four Drizzle tables                                                 |
| `drizzle.config.ts`          | Schema export configuration                                                     |
| `create-tables.generated.ts` | Generated create-if-missing DDL; never hand edit                                |
| `tables/`                    | One folder per table, schema and queries; data scenarios in its README          |

Flow: `use-cases → tables/*/queries.ts → connection.ts → main/sqlite`. Account/token writes and repo batches use synchronous transactions. Foreign keys cascade account deletion to repo/favorite/credential rows. `npm run db:generate` updates DDL. No migrations or automatic reset; this is a new separate DB, so existing local-repo data is untouched. A mismatched development schema requires an explicitly approved reset, not silent data removal.
