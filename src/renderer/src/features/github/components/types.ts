export type CiStatus = 'passing' | 'failing' | 'in-progress' | 'none'

export type Commit = {
  hash: string
  message: string
  ciStatus: CiStatus
  /** Commit time (epoch ms). */
  committedAt?: number
}

export type PullRequest = {
  number: number
  title: string
  author: string
  time: string
  ciStatus: CiStatus
  comments: number
  status: string
  hasUncommitted: boolean
  commits: Commit[]
  task?: string
}

export type Worktree = {
  name: string
  branch: string
  author: string
  changes: string
  hasUncommitted: boolean
  prNumber?: number
  path?: string
  isMain?: boolean
  isDetached?: boolean
  /** The checkout folder is gone from disk; `git worktree prune` would drop it. */
  isPrunable?: boolean
  /** Remote branch the local branch tracks (e.g. `origin/feat-x`), when it has one. */
  upstream?: string | null
  /** Uncommitted modified, staged, renamed, conflicted or untracked files in the checkout. */
  changedFiles?: number
  ahead?: number | null
  behind?: number | null
  /** First line of the last commit's message on HEAD. */
  lastCommitMessage?: string
  lastCommitAt?: number
}

export type Repository = {
  id?: string
  name: string
  detail: string
  color: string
  defaultBranch: string
  masterCi: CiStatus
  masterCommits: Commit[]
  prs: PullRequest[]
  worktrees: Worktree[]
  isLocal?: boolean
  /** Last activity in any checkout (epoch ms); local repos only. */
  updatedAt?: number
  /** Saved place in the user's order (0 = first); null until placed. Local repos only. */
  position?: number | null
}
