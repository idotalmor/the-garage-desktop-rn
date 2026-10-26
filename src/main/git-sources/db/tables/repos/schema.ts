/** Cached repo facts returned by a Git provider, scoped to the account that can read them. */
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { gitSources } from '../git-sources/schema'

export const gitSourceRepos = sqliteTable(
  'git_source_repos',
  {
    /** Account that fetched this repo, removed on disconnect. */
    sourceId: text('source_id')
      .notNull()
      .references(() => gitSources.id, { onDelete: 'cascade' }),
    /** Stable repo id from GitHub. */
    externalId: text('external_id').notNull(),
    /** Name from GitHub. */
    name: text('name').notNull(),
    /** Owner/repo from GitHub. */
    fullName: text('full_name').notNull(),
    /** Host serving the provider API. */
    host: text('host').notNull(),
    /** Browser URL from GitHub. */
    url: text('url').notNull(),
    /** HTTPS clone URL from GitHub. */
    cloneUrl: text('clone_url').notNull(),
    /** SSH clone URL from GitHub. */
    sshUrl: text('ssh_url').notNull(),
    /** Default branch from GitHub, null for an empty repo. */
    defaultBranch: text('default_branch'),
    /** Private flag from GitHub. */
    isPrivate: integer('is_private', { mode: 'boolean' }).notNull(),
    /** Archived flag from GitHub. */
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull(),
    /** Fork flag from GitHub. */
    isFork: integer('is_fork', { mode: 'boolean' }).notNull(),
    /** Description from GitHub. */
    description: text('description'),
    /** Last push time from GitHub, epoch ms. */
    pushedAt: integer('pushed_at'),
    /** Last update time from GitHub, epoch ms. */
    updatedAt: integer('updated_at').notNull()
  },
  (table) => [primaryKey({ columns: [table.sourceId, table.externalId] })]
)
export type GitSourceRepoDbEntity = typeof gitSourceRepos.$inferSelect
