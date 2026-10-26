/** Explicit app favorites reference cached repos; no GitHub star is changed. */
import { sqliteTable, text, primaryKey, foreignKey } from 'drizzle-orm/sqlite-core'
import { gitSourceRepos } from '../repos/schema'

export const gitSourceFavorites = sqliteTable(
  'git_source_favorites',
  {
    /** Account through which the user selected this repo. */
    sourceId: text('source_id').notNull(),
    /** Provider's repo id selected by the user. */
    externalId: text('external_id').notNull()
  },
  (table) => [
    primaryKey({ columns: [table.sourceId, table.externalId] }),
    foreignKey({
      columns: [table.sourceId, table.externalId],
      foreignColumns: [gitSourceRepos.sourceId, gitSourceRepos.externalId]
    }).onDelete('cascade')
  ]
)
export type GitSourceFavoriteDbEntity = typeof gitSourceFavorites.$inferSelect
