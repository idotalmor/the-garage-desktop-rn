/** Main-only encrypted tokens, separated from the public account facts. */
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { gitSources } from '../git-sources/schema'
export const gitSourceCredentials = sqliteTable('git_source_credentials', {
  /** Account owning this encrypted access token; cascades on disconnect. */
  sourceId: text('source_id')
    .primaryKey()
    .references(() => gitSources.id, { onDelete: 'cascade' }),
  /** safeStorage-encrypted OAuth token encoded as base64; main-process only. */
  encryptedToken: text('encrypted_token').notNull()
})
export type GitSourceCredentialDbEntity = typeof gitSourceCredentials.$inferSelect
