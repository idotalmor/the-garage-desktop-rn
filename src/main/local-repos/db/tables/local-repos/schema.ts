/** `local_repos` table: one row per repo on disk, keyed by a hash of its shared git directory. */
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { CommitSummary, GitProvider, GitRemote } from '../../../../../shared/git/types'

export const localRepos = sqliteTable(
  'local_repos',
  {
    /** First 16 hex chars of the SHA-1 of `commonDir`, so the same repo always gets the same id. */
    id: text('id').primaryKey(),
    /**
     * Display name. The repo name from the primary remote URL (`git@github.com:me/app.git` → `app`).
     * Without a remote: the main checkout's folder name, else the git dir's folder name.
     */
    name: text('name').notNull(),
    /**
     * The git database shared by all checkouts (`git rev-parse --git-common-dir`), e.g.
     * `~/code/app/.git`, or `~/code/app.git` for a bare repo. Unique: one row per repo on disk.
     */
    commonDir: text('common_dir').notNull().unique(),
    /**
     * Bare repo (`git clone --bare`): only the git database, no folder of files to work in; its
     * checkouts are linked worktrees. From `git rev-parse --is-bare-repository`. Not related to
     * uncommitted changes (those are `local_worktrees.changed_files`). Stored as 0/1.
     */
    isBare: integer('is_bare', { mode: 'boolean' }).notNull().default(false),
    /** Host of the primary remote: `github`, `other` (GitLab, Bitbucket…), or `none` (no remote). */
    provider: text('provider').$type<GitProvider>().notNull(),
    /** `owner/repo` from the primary remote URL, e.g. `idotalmor/the-garage-desktop-rn`. Null without a remote. */
    fullName: text('full_name'),
    /**
     * Lowercase `host/owner/repo` from the primary remote URL. SSH, HTTPS and SSH host aliases give the
     * same value. Used to match the repo to GitHub; two clones of one repo share it. Null without a remote.
     */
    slug: text('slug'),
    /** Raw URL of the primary remote (`origin`, else the first remote), as in `git remote -v`. */
    remoteUrl: text('remote_url'),
    /** Every remote from `git config --get-regexp remote.*.url`, with its parsed slug. Stored as JSON text. */
    remotes: text('remotes', { mode: 'json' }).$type<GitRemote[]>().notNull().default([]),
    /**
     * The repo's main branch: what `origin/HEAD` points to, else the first of main/master/develop/trunk
     * that exists. Null if none is found.
     */
    defaultBranch: text('default_branch'),
    /** Latest commit on the default branch (the remote's copy when there is one). Stored as JSON text. */
    defaultBranchCommit: text('default_branch_commit', { mode: 'json' }).$type<CommitSummary>(),
    /** When this repo was last read from disk by a scan or a live refresh (epoch ms). */
    scannedAt: integer('scanned_at').notNull(),
    /**
     * When something last happened in one of its checkouts (epoch ms). A scan sets it from the newest
     * commit in any checkout; a live change that alters a checkout (commit, branch switch, file edit,
     * worktree added or removed) sets it to that moment. Never moves backwards.
     */
    updatedAt: integer('updated_at').notNull().default(0),
    /**
     * Place in the user's repo order in the UI (0 = first). Written only by `setLocalRepoPositions` when
     * the user picks a sort or drags a repo; scans never change it. Null until placed (shown last).
     */
    position: integer('position')
  },
  (table) => [index('idx_local_repos_slug').on(table.slug)]
)

/** A `local_repos` row as read from the DB. */
export type LocalRepoDbEntity = typeof localRepos.$inferSelect
