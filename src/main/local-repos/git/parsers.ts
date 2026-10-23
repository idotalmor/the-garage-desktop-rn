/**
 * Pure parsers for git's machine-readable output. No I/O here, so these are easy to unit test.
 */
import type { CommitSummary } from '../../../shared/local-repos/types'

/** One entry of `git worktree list --porcelain`. */
export type PorcelainWorktree = {
  path: string
  head: string | null
  branch: string | null
  isBare: boolean
  isDetached: boolean
  isLocked: boolean
  isPrunable: boolean
}

/** Parses `git worktree list --porcelain`. The first entry is the main checkout (or the bare repo). */
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

/** Branch info and dirty-file count of one checkout. */
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

/** `git log` format matching `parseLogLine`: hash, subject, author, commit time (unix seconds). */
export const LOG_FORMAT = '--format=%H%x00%s%x00%an%x00%ct'

/** Parses one `git log -1 ${LOG_FORMAT}` line. */
export function parseLogLine(output: string): CommitSummary | null {
  const [hash, message, author, committedAt] = output.trim().split('\0')
  if (!hash) return null
  return {
    hash,
    message: message ?? '',
    author: author ?? '',
    committedAt: Number(committedAt) * 1000
  }
}

/** Parses `git config --get-regexp '^remote\..*\.url$'` into `{ name, url }` pairs. */
export function parseRemoteConfig(output: string): { name: string; url: string }[] {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(' ')
      return { name: key.replace(/^remote\./, '').replace(/\.url$/, ''), url: rest.join(' ') }
    })
}
