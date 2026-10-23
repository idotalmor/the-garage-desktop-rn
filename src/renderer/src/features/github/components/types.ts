export type CiStatus = 'passing' | 'failing' | 'in-progress' | 'none'

export type Commit = {
  hash: string
  message: string
  ciStatus: CiStatus
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
  ahead?: number | null
  behind?: number | null
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
}
