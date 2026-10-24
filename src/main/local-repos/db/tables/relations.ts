/** How the tables link, for relational queries (`db.query.localRepos.findMany({ with: { worktrees } })`). */
import { relations } from 'drizzle-orm'
import { localRepos } from './local-repos/schema'
import { localWorktrees } from './local-worktrees/schema'

export const localReposRelations = relations(localRepos, ({ many }) => ({
  worktrees: many(localWorktrees)
}))

export const localWorktreesRelations = relations(localWorktrees, ({ one }) => ({
  repo: one(localRepos, { fields: [localWorktrees.repoId], references: [localRepos.id] })
}))
