/** `local_repos` table: one row per repo on disk, keyed by a hash of its shared git directory. */
import type Database from 'better-sqlite3'
import type {
  CommitSummary,
  GitProvider,
  GitRemote,
  LocalRepository,
  LocalWorktree,
  ScannedRepository
} from '../../../../shared/local-repos/types'
import { parseJson, toJson } from '../utils/json'

export const LOCAL_REPOS_TABLE = 'local_repos'

export type LocalRepoRow = {
  id: string
  name: string
  common_dir: string
  /** 0 or 1. */
  is_bare: number
  provider: string
  full_name: string | null
  slug: string | null
  remote_url: string | null
  /** JSON `GitRemote[]`. */
  remotes: string
  default_branch: string | null
  /** JSON `CommitSummary`. */
  default_branch_commit: string | null
  scanned_at: number
}

export const CREATE_LOCAL_REPOS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${LOCAL_REPOS_TABLE} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    common_dir TEXT NOT NULL UNIQUE,
    is_bare INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    full_name TEXT,
    slug TEXT,
    remote_url TEXT,
    remotes TEXT NOT NULL DEFAULT '[]',
    default_branch TEXT,
    default_branch_commit TEXT,
    scanned_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_${LOCAL_REPOS_TABLE}_slug ON ${LOCAL_REPOS_TABLE}(slug);
`

export function toLocalRepoRow(repo: ScannedRepository): LocalRepoRow {
  return {
    id: repo.id,
    name: repo.name,
    common_dir: repo.commonDir,
    is_bare: repo.isBare ? 1 : 0,
    provider: repo.provider,
    full_name: repo.fullName,
    slug: repo.slug,
    remote_url: repo.remoteUrl,
    remotes: JSON.stringify(repo.remotes),
    default_branch: repo.defaultBranch,
    default_branch_commit: toJson(repo.defaultBranchCommit),
    scanned_at: repo.scannedAt
  }
}

export function toLocalRepository(
  row: LocalRepoRow,
  scanFolderIds: string[],
  worktrees: LocalWorktree[]
): LocalRepository {
  return {
    id: row.id,
    name: row.name,
    commonDir: row.common_dir,
    isBare: row.is_bare === 1,
    provider: row.provider as GitProvider,
    fullName: row.full_name,
    slug: row.slug,
    remoteUrl: row.remote_url,
    remotes: parseJson<GitRemote[]>(row.remotes, []),
    defaultBranch: row.default_branch,
    defaultBranchCommit: parseJson<CommitSummary | null>(row.default_branch_commit, null),
    scanFolderIds,
    worktrees,
    scannedAt: row.scanned_at
  }
}

export function listLocalRepoRows(db: Database.Database): LocalRepoRow[] {
  return db.prepare(`SELECT * FROM ${LOCAL_REPOS_TABLE} ORDER BY name`).all() as LocalRepoRow[]
}

export function upsertLocalRepo(db: Database.Database, repo: ScannedRepository): void {
  db.prepare(
    `
    INSERT INTO ${LOCAL_REPOS_TABLE} (
      id, name, common_dir, is_bare, provider, full_name, slug, remote_url, remotes,
      default_branch, default_branch_commit, scanned_at
    ) VALUES (
      @id, @name, @common_dir, @is_bare, @provider, @full_name, @slug, @remote_url, @remotes,
      @default_branch, @default_branch_commit, @scanned_at
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, is_bare = excluded.is_bare, provider = excluded.provider,
      full_name = excluded.full_name, slug = excluded.slug, remote_url = excluded.remote_url,
      remotes = excluded.remotes, default_branch = excluded.default_branch,
      default_branch_commit = excluded.default_branch_commit, scanned_at = excluded.scanned_at
  `
  ).run(toLocalRepoRow(repo))
}

export function hasLocalRepo(db: Database.Database, id: string): boolean {
  return !!db.prepare(`SELECT 1 FROM ${LOCAL_REPOS_TABLE} WHERE id = ?`).get(id)
}

/** Deletes repos by id. Their worktrees cascade. */
export function deleteLocalRepos(db: Database.Database, ids: string[]): void {
  const remove = db.prepare(`DELETE FROM ${LOCAL_REPOS_TABLE} WHERE id = ?`)
  for (const id of ids) remove.run(id)
}
