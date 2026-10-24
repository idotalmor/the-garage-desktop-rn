/** `local_worktrees` table: the checkouts of each repo (main checkout + linked worktrees). */
import type { CommitSummary } from '../../../../../shared/git/types'
import type { Json } from '../../../../sqlite'
import { LOCAL_REPOS_TABLE } from '../local-repos/schema'

export const LOCAL_WORKTREES_TABLE = 'local_worktrees'

export type LocalWorktreeDbEntity = {
  /** Absolute path of the checkout folder, from `git worktree list`. Primary key: one row per checkout. */
  path: string
  /** The `local_repos.id` this checkout belongs to. Deleting the repo deletes its checkouts. */
  repo_id: string
  /** Order within the repo, as `git worktree list` prints them; 0 is the main checkout when there is one. */
  position: number
  /** The checkout folder's name, e.g. `feat-x` for `~/wt/feat-x`. */
  name: string
  /** 1 = the main checkout (where the repo was cloned), 0 = a linked worktree from `git worktree add`. 0 or 1. */
  is_main: number
  /** Checked-out branch, e.g. `main`. Null when no branch is checked out (detached HEAD). */
  branch: string | null
  /** 1 = a commit is checked out directly instead of a branch (detached HEAD). 0 or 1. */
  is_detached: number
  /** Full SHA of the checked-out commit. */
  head: string | null
  /** 1 = locked with `git worktree lock`, so `git worktree prune` won't remove it. 0 or 1. */
  is_locked: number
  /**
   * 1 = git still lists this worktree but its folder is gone (e.g. deleted by hand); `git worktree prune`
   * would remove it. Status fields are not read for it. 0 or 1.
   */
  is_prunable: number
  /** Remote branch the checked-out branch tracks, e.g. `origin/main`. Null if it tracks none. */
  upstream: string | null
  /** Local commits not pushed to `upstream` yet. Null without an upstream. */
  ahead: number | null
  /** Commits on `upstream` not pulled yet (as of the last `git fetch`). Null without an upstream. */
  behind: number | null
  /** Uncommitted files: modified, staged, untracked or conflicted, from `git status`. */
  changed_files: number
  /** JSON `CommitSummary`: the latest commit on this checkout's HEAD. */
  last_commit: Json<CommitSummary> | null
}

export const CREATE_LOCAL_WORKTREES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${LOCAL_WORKTREES_TABLE} (
    path TEXT PRIMARY KEY,
    repo_id TEXT NOT NULL REFERENCES ${LOCAL_REPOS_TABLE}(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_main INTEGER NOT NULL DEFAULT 0,
    branch TEXT,
    is_detached INTEGER NOT NULL DEFAULT 0,
    head TEXT,
    is_locked INTEGER NOT NULL DEFAULT 0,
    is_prunable INTEGER NOT NULL DEFAULT 0,
    upstream TEXT,
    ahead INTEGER,
    behind INTEGER,
    changed_files INTEGER NOT NULL DEFAULT 0,
    last_commit TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_${LOCAL_WORKTREES_TABLE}_repo ON ${LOCAL_WORKTREES_TABLE}(repo_id);
  CREATE INDEX IF NOT EXISTS idx_${LOCAL_WORKTREES_TABLE}_branch ON ${LOCAL_WORKTREES_TABLE}(branch);
`
