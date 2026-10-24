/** Queries on `local_worktrees`. Each takes the open DB as its first argument. */
import { eq, inArray } from 'drizzle-orm'
import type { LocalWorktree } from '../../../../../shared/local-repos/types'
import type { LocalReposDb } from '../../types'
import { localWorktrees } from './schema'

/**
 * Replaces all worktrees of a repo with `worktrees`, keeping their order. A path is stored once:
 * if another repo still had a row for it (e.g. a folder reused for a new clone), it moves here.
 */
export function replaceRepoWorktrees(
  db: LocalReposDb,
  repoId: string,
  worktrees: LocalWorktree[]
): void {
  db.delete(localWorktrees).where(eq(localWorktrees.repoId, repoId)).run()
  if (worktrees.length === 0) return
  const paths = worktrees.map((tree) => tree.path)
  db.delete(localWorktrees).where(inArray(localWorktrees.path, paths)).run()
  db.insert(localWorktrees)
    .values(worktrees.map((tree, position) => ({ ...tree, repoId, position })))
    .run()
}
