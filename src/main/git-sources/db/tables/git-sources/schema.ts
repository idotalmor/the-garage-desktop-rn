/** Connected account facts; encrypted credentials are separate and never selected for IPC. */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import type { GitSourceProvider } from '../../../../../shared/git-sources/types'

export const gitSources = sqliteTable('git_sources', {
  /** Stable provider/account key derived from provider user id. */
  id: text('id').primaryKey(),
  /** Adapter used to authorize the account. */
  provider: text('provider').$type<GitSourceProvider>().notNull(),
  /** Provider's numeric user id encoded as a string. */
  externalId: text('external_id').notNull(),
  /** Login returned by the provider's user endpoint. */
  login: text('login').notNull(),
  /** Avatar URL returned by the provider's user endpoint. */
  avatarUrl: text('avatar_url').notNull(),
  /** OAuth scopes returned with the access token. */
  scopes: text('scopes', { mode: 'json' }).$type<string[]>().notNull(),
  /** Local timestamp of successful authorization. */
  connectedAt: integer('connected_at').notNull()
})
export type GitSourceDbEntity = typeof gitSources.$inferSelect
