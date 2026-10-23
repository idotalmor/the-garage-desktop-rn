/** `local_worktrees` table: the checkouts of each repo (main checkout + linked worktrees). */
import type Database from 'better-sqlite3'
import type { CommitSummary, LocalWorktree } from '../../../../shared/local-repos/types'
import { parseJson, toJson } from '../utils/json'

export const LOCAL_WORKTREES_TABLE = 'local_worktrees'

export type LocalWorktreeRow = {
  path: string
  repo_id: string
  /** Order within the repo; 0 is the main checkout when there is one. */
  position: number
  name: string
  /** 0 or 1. */
  is_main: number
  branch: string | null
  /** 0 or 1. */
  is_detached: number
  head: string | null
  /** 0 or 1. */
  is_locked: number
  /** 0 or 1. */
  is_prunable: number
  upstream: string | null
  ahead: number | null
  behind: number | null
  changed_files: number
  /** JSON `CommitSummary`. */
  last_commit: string | null
}

export const CREATE_LOCAL_WORKTREES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${LOCAL_WORKTREES_TABLE} (
    path TEXT PRIMARY KEY,
    repo_id TEXT NOT NULL REFERENCES local_repos(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_main INTEGER NOT NULL DEFAULT 0,
    branch TEXT,
    is_detached INTEGER NOT NULL DEFAULT 0,
    head TEXT,
    is_locked INTEGER NOT NULL DEFAULT 0,
    is_prunable INTEGER NOT NULL DEFAULT 0,
    upstream TEXT,
    ahead INTEGER,
    behind INTEGER,
    changed_files INTEGER NOT NULL DEFAULT 0,
    last_commit TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_${LOCAL_WORKTREES_TABLE}_repo ON ${LOCAL_WORKTREES_TABLE}(repo_id);
  CREATE INDEX IF NOT EXISTS idx_${LOCAL_WORKTREES_TABLE}_branch ON ${LOCAL_WORKTREES_TABLE}(branch);
`

export function toLocalWorktreeRow(
  tree: LocalWorktree,
  repoId: string,
  position: number
): LocalWorktreeRow {
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

export function toLocalWorktree(row: LocalWorktreeRow): LocalWorktree {
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
    lastCommit: parseJson<CommitSummary | null>(row.last_commit, null)
  }
}

export function listLocalWorktreeRows(db: Database.Database): LocalWorktreeRow[] {
  return db
    .prepare(`SELECT * FROM ${LOCAL_WORKTREES_TABLE} ORDER BY repo_id, position`)
    .all() as LocalWorktreeRow[]
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
  worktrees.forEach((tree, position) => insert.run(toLocalWorktreeRow(tree, repoId, position)))
}
