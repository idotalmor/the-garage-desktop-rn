/** Parses `git worktree list --porcelain`. Pure: no I/O. */
import type { GitWorktreeEntry } from '../types'

/** One entry per checkout. The first entry is the main checkout (or the bare repo). */
export function parseWorktreeList(output: string): GitWorktreeEntry[] {
  const worktrees: GitWorktreeEntry[] = []
  for (const block of output.split(/\n\n+/)) {
    const lines = block.split('\n').filter(Boolean)
    const pathLine = lines.find((line) => line.startsWith('worktree '))
    if (!pathLine) continue
    const entry: GitWorktreeEntry = {
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
