# App updates DB (`app-updates/db`)

`~/.devflow/app-updates.db`, opened with [`openDatabase`](../../sqlite/README.md). Tables and
scenarios: [tables/README.md](tables/README.md).

| File                         | What it is                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `connection.ts`              | `getDb`, `resetDb`, `transaction`                                                                |
| `schema.ts`                  | Re-exports the tables                                                                            |
| `drizzle.config.ts`          | drizzle-kit config (`npm run db:generate`)                                                       |
| `create-tables.generated.ts` | Generated `CREATE TABLE IF NOT EXISTS`                                                           |
| `tables/bundles/schema.ts`   | `bundles` table, `BundleDbEntity`, `BundleStatus`                                                |
| `tables/bundles/queries.ts`  | `listBundles`, `listBaseBundles`, `findBundle`, `saveBundle`, `setBundleStatus`, `deleteBundles` |
