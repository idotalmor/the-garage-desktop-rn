import { execFile } from 'child_process'
import { existsSync } from 'fs'
import type { CommitSummary } from '../../shared/worktrees/types'

const GIT_CANDIDATES = ['/opt/homebrew/bin/git', '/usr/local/bin/git', '/usr/bin/git']

// Apps launched from Finder don't inherit the login-shell PATH, so resolve git explicitly.
const gitBinary = GIT_CANDIDATES.find((candidate) => existsSync(candidate)) ?? 'git'

const GIT_ENV = {
  ...process.env,
  GIT_OPTIONAL_LOCKS: '0',
  GIT_TERMINAL_PROMPT: '0',
  LC_ALL: 'C'
}

export class GitError extends Error {
  constructor(
    message: string,
    readonly exitCode: number | null
  ) {
    super(message)
  }
}

export function git(cwd: string, args: string[], timeoutMs = 15_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      gitBinary,
      ['-C', cwd, ...args],
      { env: GIT_ENV, timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          const code = typeof error.code === 'number' ? error.code : null
          reject(new GitError(String(stderr || error.message).trim(), code))
          return
        }
        resolve(stdout)
      }
    )
  })
}

export async function gitOrNull(cwd: string, args: string[]): Promise<string | null> {
  try {
    return await git(cwd, args)
  } catch {
    return null
  }
}

export type PorcelainWorktree = {
  path: string
  head: string | null
  branch: string | null
  isBare: boolean
  isDetached: boolean
  isLocked: boolean
  isPrunable: boolean
}

/** Parses `git worktree list --porcelain`. The first entry is the main worktree (or bare repo). */
export function parseWorktreeList(output: string): PorcelainWorktree[] {
  const worktrees: PorcelainWorktree[] = []
  for (const block of output.split(/\n\n+/)) {
    const lines = block.split('\n').filter(Boolean)
    const pathLine = lines.find((line) => line.startsWith('worktree '))
    if (!pathLine) continue
    const entry: PorcelainWorktree = {
      path: pathLine.slice('worktree '.length),
      head: null,
      branch: null,
      isBare: false,
      isDetached: false,
      isLocked: false,
      isPrunable: false
    }
    for (const line of lines) {
      if (line.startsWith('HEAD ')) entry.head = line.slice(5)
      else if (line.startsWith('branch '))
        entry.branch = line.slice(7).replace(/^refs\/heads\//, '')
      else if (line === 'bare') entry.isBare = true
      else if (line === 'detached') entry.isDetached = true
      else if (line === 'locked' || line.startsWith('locked ')) entry.isLocked = true
      else if (line === 'prunable' || line.startsWith('prunable ')) entry.isPrunable = true
    }
    worktrees.push(entry)
  }
  return worktrees
}

export type BranchStatus = {
  head: string | null
  branch: string | null
  upstream: string | null
  ahead: number | null
  behind: number | null
  changedFiles: number
}

/** Parses `git status --porcelain=v2 --branch -z`. */
export function parseStatusV2(output: string): BranchStatus {
  const status: BranchStatus = {
    head: null,
    branch: null,
    upstream: null,
    ahead: null,
    behind: null,
    changedFiles: 0
  }
  const tokens = output.split('\0')
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue
    if (token.startsWith('# branch.oid ')) {
      const oid = token.slice(13)
      status.head = oid === '(initial)' ? null : oid
    } else if (token.startsWith('# branch.head ')) {
      const head = token.slice(14)
      status.branch = head === '(detached)' ? null : head
    } else if (token.startsWith('# branch.upstream ')) {
      status.upstream = token.slice(18)
    } else if (token.startsWith('# branch.ab ')) {
      const match = /\+(\d+) -(\d+)/.exec(token)
      if (match) {
        status.ahead = Number(match[1])
        status.behind = Number(match[2])
      }
    } else if (token.startsWith('1 ') || token.startsWith('u ') || token.startsWith('? ')) {
      status.changedFiles++
    } else if (token.startsWith('2 ')) {
      status.changedFiles++
      i++ // rename/copy entries are followed by the original path
    }
  }
  return status
}

const LOG_FORMAT = '--format=%H%x00%s%x00%an%x00%ct'

export async function lastCommit(cwd: string, ref = 'HEAD'): Promise<CommitSummary | null> {
  const output = await gitOrNull(cwd, ['log', '-1', LOG_FORMAT, ref, '--'])
  if (!output) return null
  const [hash, message, author, committedAt] = output.trim().split('\0')
  if (!hash) return null
  return {
    hash,
    message: message ?? '',
    author: author ?? '',
    committedAt: Number(committedAt) * 1000
  }
}
