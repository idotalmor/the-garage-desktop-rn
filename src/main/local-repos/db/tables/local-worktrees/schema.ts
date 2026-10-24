/** `local_worktrees` table: the checkouts of each repo (main checkout + linked worktrees). */
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { CommitSummary } from '../../../../../shared/git/types'
import { localRepos } from '../local-repos/schema'

export const localWorktrees = sqliteTable(
  'local_worktrees',
  {
    /** Absolute path of the checkout folder, from `git worktree list`. Primary key: one row per checkout. */
    path: text('path').primaryKey(),
    /** The `local_repos.id` this checkout belongs to. Deleting the repo deletes its checkouts. */
    repoId: text('repo_id')
      .notNull()
      .references(() => localRepos.id, { onDelete: 'cascade' }),
    /** Order within the repo, as `git worktree list` prints them; 0 is the main checkout when there is one. */
    position: integer('position').notNull(),
    /** The checkout folder's name, e.g. `feat-x` for `~/wt/feat-x`. */
    name: text('name').notNull(),
    /** The main checkout (where the repo was cloned), vs a linked worktree from `git worktree add`. Stored as 0/1. */
    isMain: integer('is_main', { mode: 'boolean' }).notNull().default(false),
    /** Checked-out branch, e.g. `main`. Null when no branch is checked out (detached HEAD). */
    branch: text('branch'),
    /** A commit is checked out directly instead of a branch (detached HEAD). Stored as 0/1. */
    isDetached: integer('is_detached', { mode: 'boolean' }).notNull().default(false),
    /** Full SHA of the checked-out commit. */
    head: text('head'),
    /** Locked with `git worktree lock`, so `git worktree prune` won't remove it. Stored as 0/1. */
    isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
    /**
     * Git still lists this worktree but its folder is gone (e.g. deleted by hand); `git worktree prune`
     * would remove it. Status fields are not read for it. Stored as 0/1.
     */
    isPrunable: integer('is_prunable', { mode: 'boolean' }).notNull().default(false),
    /** Remote branch the checked-out branch tracks, e.g. `origin/main`. Null if it tracks none. */
    upstream: text('upstream'),
    /** Local commits not pushed to `upstream` yet. Null without an upstream. */
    ahead: integer('ahead'),
    /** Commits on `upstream` not pulled yet (as of the last `git fetch`). Null without an upstream. */
    behind: integer('behind'),
    /** Uncommitted files: modified, staged, untracked or conflicted, from `git status`. */
    changedFiles: integer('changed_files').notNull().default(0),
    /** The latest commit on this checkout's HEAD. Stored as JSON text. */
    lastCommit: text('last_commit', { mode: 'json' }).$type<CommitSummary>()
  },
  (table) => [
    index('idx_local_worktrees_repo').on(table.repoId),
    index('idx_local_worktrees_branch').on(table.branch)
  ]
)

/** A `local_worktrees` row as read from the DB. */
export type LocalWorktreeDbEntity = typeof localWorktrees.$inferSelect
