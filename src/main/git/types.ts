/** Git types only the main process uses: parsed command output before features turn it into their own types. */

/** One entry of `git worktree list --porcelain` (git's stable, machine-readable output). */
export type GitWorktreeEntry = {
  /** Absolute path of the checkout (or of the bare repo, for its own entry). */
  path: string
  /** SHA HEAD points to. Null in a repo with no commits yet. */
  head: string | null
  /** Checked-out branch without `refs/heads/`. Null when detached or bare. */
  branch: string | null
  /** The bare repo's own entry (it has no files to check out). */
  isBare: boolean
  /** HEAD points at a commit, not a branch. */
  isDetached: boolean
  /** Locked with `git worktree lock`. */
  isLocked: boolean
  /** The checkout folder is gone; `git worktree prune` would remove it. */
  isPrunable: boolean
}

/** Branch info and changed-file count of one checkout, from `git status --porcelain=v2 --branch`. */
export type BranchStatus = {
  /** SHA HEAD points to. Null in a repo with no commits yet. */
  head: string | null
  /** Checked-out branch. Null when detached. */
  branch: string | null
  /** Tracked remote branch, e.g. `origin/main`. Null if none. */
  upstream: string | null
  /** Commits not pushed to `upstream`. Null without an upstream. */
  ahead: number | null
  /** Commits on `upstream` not pulled yet. Null without an upstream. */
  behind: number | null
  /** Modified, staged, renamed, conflicted or untracked files. */
  changedFiles: number
}
