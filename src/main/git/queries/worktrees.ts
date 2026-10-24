/** Lists the checkouts of a repo. */
import { parseWorktreeList } from '../parsers/worktrees'
import { git } from '../run'
import type { GitWorktreeEntry } from '../types'

/** Every checkout of the repo `dir` belongs to, main checkout first. Throws if git fails. */
export async function listWorktrees(dir: string): Promise<GitWorktreeEntry[]> {
  return parseWorktreeList(await git(dir, ['worktree', 'list', '--porcelain']))
}

/** Drops worktree admin entries whose checkout folder is gone (e.g. one was moved to Trash). */
export function pruneWorktrees(dir: string): Promise<string> {
  return git(dir, ['worktree', 'prune'])
}
