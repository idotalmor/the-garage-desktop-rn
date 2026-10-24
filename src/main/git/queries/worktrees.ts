/** Lists the checkouts of a repo. */
import { parseWorktreeList } from '../parsers/worktrees'
import { git } from '../run'
import type { GitWorktreeEntry } from '../types'

/** Every checkout of the repo `dir` belongs to, main checkout first. Throws if git fails. */
export async function listWorktrees(dir: string): Promise<GitWorktreeEntry[]> {
  return parseWorktreeList(await git(dir, ['worktree', 'list', '--porcelain']))
}
