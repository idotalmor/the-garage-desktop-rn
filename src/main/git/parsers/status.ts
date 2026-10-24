/** Parses `git status --porcelain=v2 --branch -z`. Pure: no I/O. */
import type { BranchStatus } from '../types'

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
