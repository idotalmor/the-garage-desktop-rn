import type { LocalRepository, LocalWorktree } from '../../../../shared/worktrees/types'
import type { Repository, Worktree } from './components/types'

const REPO_COLORS = [
  'bg-violet-400',
  'bg-cyan-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-sky-400',
  'bg-lime-400',
  'bg-fuchsia-400'
]

function colorFor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return REPO_COLORS[hash % REPO_COLORS.length]
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function describeChanges(tree: LocalWorktree): string {
  const parts = [tree.changedFiles > 0 ? plural(tree.changedFiles, 'changed file') : 'Clean']
  if (tree.ahead) parts.push(`↑${tree.ahead}`)
  if (tree.behind) parts.push(`↓${tree.behind}`)
  if (tree.branch && !tree.upstream) parts.push('not pushed')
  if (tree.isPrunable) parts.push('missing on disk')
  return parts.join(' · ')
}

export function toUiWorktree(tree: LocalWorktree): Worktree {
  return {
    name: tree.name,
    branch: tree.branch ?? `detached @ ${tree.head?.slice(0, 7) ?? 'unknown'}`,
    author: tree.lastCommit?.author ?? '',
    changes: describeChanges(tree),
    hasUncommitted: tree.changedFiles > 0,
    path: tree.path,
    isMain: tree.isMain,
    isDetached: tree.isDetached,
    ahead: tree.ahead,
    behind: tree.behind,
    lastCommitAt: tree.lastCommit?.committedAt
  }
}

/** Maps a scanned clone to the dashboard `Repository` shape (no PR/CI data until GitHub is connected). */
export function toUiRepository(repo: LocalRepository): Repository {
  const main = repo.worktrees.find((tree) => tree.isMain)
  const commit = repo.defaultBranchCommit
  return {
    id: repo.id,
    name: repo.name,
    detail: repo.fullName ?? main?.path ?? repo.commonDir,
    color: colorFor(repo.slug ?? repo.id),
    defaultBranch: repo.defaultBranch ?? main?.branch ?? 'HEAD',
    masterCi: 'none',
    masterCommits: commit
      ? [{ hash: commit.hash.slice(0, 7), message: commit.message, ciStatus: 'none' }]
      : [],
    prs: [],
    worktrees: repo.worktrees.map(toUiWorktree),
    isLocal: true
  }
}
