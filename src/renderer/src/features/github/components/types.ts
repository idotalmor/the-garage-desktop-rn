import type { GitSourceRepo } from '../../../../../shared/git-sources/types'

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
  /** GitHub repo root from provider metadata or the normalized local primary remote, if known. */
  githubUrl?: string
  /** Provider metadata matched by canonical primary remote, or a remote-only favorite. */
  gitSourceRepo?: GitSourceRepo
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

/** Which local history a commit-history modal reads: a checkout's HEAD, or the repo's default branch. */
export type CommitSource = {
  /** Local repo id (`LocalRepo.id`). */
  repoId: string
  /** Checkout to read HEAD from; null = the repo's default branch. */
  worktreePath: string | null
}

/** Opens the commit-history modal. `source` is absent for mock cards with no local git data. */
export type OnHistory = (title: string, hasUncommitted?: boolean, source?: CommitSource) => void
