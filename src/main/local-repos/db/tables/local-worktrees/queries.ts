/** Single-table queries on `local_worktrees`. Each takes the open DB as its first argument. */
import type Database from 'better-sqlite3'
import type { LocalWorktree } from '../../../../../shared/local-repos/types'
import { toLocalWorktreeDbEntity } from './mapper'
import { LOCAL_WORKTREES_TABLE, type LocalWorktreeDbEntity } from './schema'

export function listLocalWorktreeDbEntities(db: Database.Database): LocalWorktreeDbEntity[] {
  return db
    .prepare(`SELECT * FROM ${LOCAL_WORKTREES_TABLE} ORDER BY repo_id, position`)
    .all() as LocalWorktreeDbEntity[]
}

/**
 * Replaces all worktrees of a repo with `worktrees`, keeping their order. A path is stored once:
 * if another repo still had a row for it (e.g. a folder reused for a new clone), it moves here.
 */
export function replaceRepoWorktrees(
  db: Database.Database,
  repoId: string,
  worktrees: LocalWorktree[]
): void {
  db.prepare(`DELETE FROM ${LOCAL_WORKTREES_TABLE} WHERE repo_id = ?`).run(repoId)
  const insert = db.prepare(`
    INSERT OR REPLACE INTO ${LOCAL_WORKTREES_TABLE} (
      path, repo_id, position, name, is_main, branch, is_detached, head, is_locked,
      is_prunable, upstream, ahead, behind, changed_files, last_commit
    ) VALUES (
      @path, @repo_id, @position, @name, @is_main, @branch, @is_detached, @head, @is_locked,
      @is_prunable, @upstream, @ahead, @behind, @changed_files, @last_commit
    )
  `)
  worktrees.forEach((tree, position) => insert.run(toLocalWorktreeDbEntity(tree, repoId, position)))
}
