import type { CommitPage, CommitSummary, GitProvider, GitRemote } from '../git/types'

/** A folder the user picked to scan. Can be a single repo, a worktree, or a parent of many repos. */
export type Source = {
  /** Random id assigned when the folder is added. */
  id: string
  /** Absolute path on disk. */
  path: string
  /** How many directory levels below `path` the scanner descends looking for repos. */
  maxDepth: number
  /** When the user added this folder (epoch ms). */
  addedAt: number
  /** When the last scan of this folder finished (epoch ms), or null if never scanned. */
  lastScannedAt: number | null
  /** Error message from the last scan (e.g. folder no longer exists), or null if it succeeded. */
  lastError: string | null
}

/** One checkout of a repo: the main checkout or a linked `git worktree`. */
export type LocalWorktree = {
  /** Absolute path of the checkout. */
  path: string
  /** Folder name of the checkout, used as a display label. */
  name: string
  /** True for the repo's original checkout, false for checkouts added with `git worktree add`. */
  isMain: boolean
  /** Checked-out branch name, or null when detached. */
  branch: string | null
  /** True when HEAD points at a commit instead of a branch. */
  isDetached: boolean
  /** SHA that HEAD points to, or null in a repo with no commits yet. */
  head: string | null
  /** Locked with `git worktree lock`: git won't prune or move it. */
  isLocked: boolean
  /** Git reports the checkout folder is gone; `git worktree prune` would remove it. */
  isPrunable: boolean
  /** Remote branch this branch tracks, e.g. `origin/main`, or null if none. */
  upstream: string | null
  /** Local commits not pushed to `upstream`. Null when there is no upstream. */
  ahead: number | null
  /** Upstream commits not pulled locally (as of the last fetch). Null when there is no upstream. */
  behind: number | null
  /** Number of modified, staged, renamed, conflicted or untracked files. */
  changedFiles: number
  /** Last commit on HEAD. */
  lastCommit: CommitSummary | null
}

/** One repo on disk with all of its checkouts. Checkouts are grouped by their shared git directory. */
export type LocalRepo = {
  /** Stable id (hash of `commonDir`). */
  id: string
  /** Display name: the remote repo name, or the folder name when there is no remote. */
  name: string
  /** The shared `.git` directory every checkout of this repo uses (`git rev-parse --git-common-dir`). */
  commonDir: string
  /** A bare repo has no checked-out files, only the git database (e.g. `git clone --bare`). Its checkouts are all linked worktrees. */
  isBare: boolean
  /** Host of the primary remote. */
  provider: GitProvider
  /** `owner/repo` of the primary remote (origin, else the first remote). */
  fullName: string | null
  /** Canonical `host/owner/repo` of the primary remote; see `GitRemote.slug`. */
  slug: string | null
  /** Raw URL of the primary remote. */
  remoteUrl: string | null
  /** All configured remotes. */
  remotes: GitRemote[]
  /** Default branch of the remote (e.g. `main`), or a local guess when the remote doesn't say. */
  defaultBranch: string | null
  /** Latest commit on the default branch. */
  defaultBranchCommit: CommitSummary | null
  /** Every checkout of this repo, main checkout first. */
  worktrees: LocalWorktree[]
  /** When this repo was last inspected (epoch ms). */
  scannedAt: number
  /**
   * When something last happened in one of its checkouts (epoch ms): the newest commit in any
   * checkout, or a live change that altered a checkout. Used for "Recently updated" sorting.
   */
  updatedAt: number
  /** Place in the user's repo order (0 = first), set by a sort or a drag. Null until placed; those go last. */
  position: number | null
}

/** A repo as the scanner reads it from disk: everything but the user's `position`, which only sorting and dragging set. */
export type ScannedRepo = Omit<LocalRepo, 'position'>

/** Live progress of the scan that is currently running. */
export type ScanProgress = {
  /** Source currently being walked. */
  sourcePath: string
  /** Directories visited so far. */
  dirsVisited: number
  /** Repos found so far. */
  reposFound: number
}

/** Everything the UI needs to render local repos, sent in one object. */
export type LocalReposSnapshot = {
  /** Folders the user chose to scan. */
  sources: Source[]
  /** Repos found across all sources. */
  repos: LocalRepo[]
  /** True while a scan is queued or running. */
  scanning: boolean
  /** Progress of the running scan, or null when idle. */
  progress: ScanProgress | null
}

/** Commits on a checkout's remote branch that it doesn't have yet (what a pull would bring in). */
export type IncomingCommits = {
  /** Remote branch they are on, e.g. `origin/feat-x` (the checkout's upstream). */
  upstream: string
  /** Newest first; at most the first 100. */
  commits: CommitSummary[]
  /** How many there are in all (can exceed `commits.length`). */
  total: number
}

/** One page of a card's commit history, plus on the first page the commits waiting to be pulled. */
export type CommitHistoryPage = CommitPage & {
  /** Commits to pull; first page of a checkout with an upstream that is behind, else null. */
  incoming: IncomingCommits | null
}

/** Outcome of pulling a checkout. */
export type PullResult =
  | { ok: true }
  | {
      ok: false
      /** Git's own error output. */
      message: string
      /** A plain next step for the user (e.g. "commit or stash your changes"), when we recognise the error. */
      hint: string | null
    }
