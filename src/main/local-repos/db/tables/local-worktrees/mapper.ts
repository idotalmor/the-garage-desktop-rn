/** Converts between a `local_worktrees` row and the app's `LocalWorktree`. */
import type { LocalWorktree } from '../../../../../shared/local-repos/types'
import { parseJson, toJson } from '../../../../sqlite'
import type { LocalWorktreeDbEntity } from './schema'

export function toLocalWorktreeDbEntity(
  tree: LocalWorktree,
  repoId: string,
  position: number
): LocalWorktreeDbEntity {
  return {
    path: tree.path,
    repo_id: repoId,
    position,
    name: tree.name,
    is_main: tree.isMain ? 1 : 0,
    branch: tree.branch,
    is_detached: tree.isDetached ? 1 : 0,
    head: tree.head,
    is_locked: tree.isLocked ? 1 : 0,
    is_prunable: tree.isPrunable ? 1 : 0,
    upstream: tree.upstream,
    ahead: tree.ahead,
    behind: tree.behind,
    changed_files: tree.changedFiles,
    last_commit: toJson(tree.lastCommit)
  }
}

export function toLocalWorktree(row: LocalWorktreeDbEntity): LocalWorktree {
  return {
    path: row.path,
    name: row.name,
    isMain: row.is_main === 1,
    branch: row.branch,
    isDetached: row.is_detached === 1,
    head: row.head,
    isLocked: row.is_locked === 1,
    isPrunable: row.is_prunable === 1,
    upstream: row.upstream,
    ahead: row.ahead,
    behind: row.behind,
    changedFiles: row.changed_files,
    lastCommit: parseJson(row.last_commit, null)
  }
}
