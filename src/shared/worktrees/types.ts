/** A folder the user picked to scan. Can be a repo, a worktree, or a parent of many repos. */
export type ScanRoot = {
  id: string
  path: string
  maxDepth: number
  addedAt: number
  lastScannedAt: number | null
  lastError: string | null
}

export type GitProvider = 'github' | 'other' | 'none'

export type GitRemote = {
  name: string
  url: string
  host: string | null
  owner: string | null
  repo: string | null
  /** Canonical, lower-cased `host/owner/repo` — the key used to match GitHub later. */
  slug: string | null
}

export type CommitSummary = {
  hash: string
  message: string
  author: string
  committedAt: number
}

export type LocalWorktree = {
  path: string
  name: string
  isMain: boolean
  branch: string | null
  isDetached: boolean
  head: string | null
  isLocked: boolean
  isPrunable: boolean
  upstream: string | null
  ahead: number | null
  behind: number | null
  changedFiles: number
  lastCommit: CommitSummary | null
}

/** One clone on disk (grouped by git common dir), with all of its worktrees. */
export type LocalRepository = {
  id: string
  name: string
  commonDir: string
  isBare: boolean
  provider: GitProvider
  /** `owner/repo` of the primary remote (origin, else first remote). */
  fullName: string | null
  slug: string | null
  remoteUrl: string | null
  remotes: GitRemote[]
  defaultBranch: string | null
  defaultBranchCommit: CommitSummary | null
  rootIds: string[]
  worktrees: LocalWorktree[]
  scannedAt: number
}

export type ScanProgress = {
  rootPath: string
  dirsVisited: number
  reposFound: number
}

export type WorktreesSnapshot = {
  roots: ScanRoot[]
  repositories: LocalRepository[]
  scanning: boolean
  progress: ScanProgress | null
}
