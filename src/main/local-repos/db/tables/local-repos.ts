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
import { parseJson, toJson, type Json } from '../utils/json'

export const LOCAL_REPOS_TABLE = 'local_repos'

export type LocalRepoDbEntity = {
  /** First 16 hex chars of the SHA-1 of `common_dir`, so the same repo always gets the same id. */
  id: string
  /**
   * Display name. The repo name from the primary remote URL (`git@github.com:me/app.git` → `app`).
   * Without a remote: the main checkout's folder name, else the git dir's folder name.
   */
  name: string
  /**
   * The git database shared by all checkouts (`git rev-parse --git-common-dir`), e.g.
   * `~/code/app/.git`, or `~/code/app.git` for a bare repo. Unique: one row per repo on disk.
   */
  common_dir: string
  /**
   * 1 = bare repo (`git clone --bare`): only the git database, no folder of files to work in; its
   * checkouts are linked worktrees. From `git rev-parse --is-bare-repository`. Not related to
   * uncommitted changes (those are `local_worktrees.changed_files`). 0 or 1.
   */
  is_bare: number
  /** Host of the primary remote: `github`, `other` (GitLab, Bitbucket…), or `none` (no remote). */
  provider: string
  /** `owner/repo` from the primary remote URL, e.g. `idotalmor/the-garage-desktop-rn`. Null without a remote. */
  full_name: string | null
  /**
   * Lowercase `host/owner/repo` from the primary remote URL. SSH, HTTPS and SSH host aliases give the
   * same value. Used to match the repo to GitHub; two clones of one repo share it. Null without a remote.
   */
  slug: string | null
  /** Raw URL of the primary remote (`origin`, else the first remote), as in `git remote -v`. */
  remote_url: string | null
  /** JSON `GitRemote[]`: every remote from `git config --get-regexp remote.*.url`, with its parsed slug. */
  remotes: Json<GitRemote[]>
  /**
   * The repo's main branch: what `origin/HEAD` points to, else the first of main/master/develop/trunk
   * that exists. Null if none is found.
   */
  default_branch: string | null
  /** JSON `CommitSummary`: latest commit on the default branch (the remote's copy when there is one). */
  default_branch_commit: Json<CommitSummary> | null
  /** When this repo was last read from disk by a scan or a live refresh (epoch ms). */
  scanned_at: number
  /**
   * When something last happened in one of its checkouts (epoch ms). A scan sets it from the newest
   * commit in any checkout; a live change that alters a checkout (commit, branch switch, file edit,
   * worktree added or removed) sets it to that moment. Never moves backwards.
   */
  updated_at: number
  /**
   * Place in the user's repo order in the UI (0 = first). Written only by `setLocalRepoPositions` when
   * the user picks a sort or drags a repo; scans never change it. Null until placed (shown last).
   */
  position: number | null
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
    scanned_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT 0,
    position INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_${LOCAL_REPOS_TABLE}_slug ON ${LOCAL_REPOS_TABLE}(slug);
`

/** Everything a scan writes; `position` is left out so scans never change the user's order. */
export function toLocalRepoDbEntity(repo: ScannedRepository): Omit<LocalRepoDbEntity, 'position'> {
  return {
    id: repo.id,
    name: repo.name,
    common_dir: repo.commonDir,
    is_bare: repo.isBare ? 1 : 0,
    provider: repo.provider,
    full_name: repo.fullName,
    slug: repo.slug,
    remote_url: repo.remoteUrl,
    remotes: toJson(repo.remotes),
    default_branch: repo.defaultBranch,
    default_branch_commit: toJson(repo.defaultBranchCommit),
    scanned_at: repo.scannedAt,
    updated_at: repo.updatedAt
  }
}

export function toLocalRepository(
  row: LocalRepoDbEntity,
  sourceIds: string[],
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
    remotes: parseJson(row.remotes, []),
    defaultBranch: row.default_branch,
    defaultBranchCommit: parseJson(row.default_branch_commit, null),
    sourceIds,
    worktrees,
    scannedAt: row.scanned_at,
    updatedAt: row.updated_at,
    position: row.position
  }
}

export function listLocalRepoDbEntities(db: Database.Database): LocalRepoDbEntity[] {
  return db
    .prepare(`SELECT * FROM ${LOCAL_REPOS_TABLE} ORDER BY position IS NULL, position, name`)
    .all() as LocalRepoDbEntity[]
}

export function upsertLocalRepo(db: Database.Database, repo: ScannedRepository): void {
  db.prepare(
    `
    INSERT INTO ${LOCAL_REPOS_TABLE} (
      id, name, common_dir, is_bare, provider, full_name, slug, remote_url, remotes,
      default_branch, default_branch_commit, scanned_at, updated_at
    ) VALUES (
      @id, @name, @common_dir, @is_bare, @provider, @full_name, @slug, @remote_url, @remotes,
      @default_branch, @default_branch_commit, @scanned_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, is_bare = excluded.is_bare, provider = excluded.provider,
      full_name = excluded.full_name, slug = excluded.slug, remote_url = excluded.remote_url,
      remotes = excluded.remotes, default_branch = excluded.default_branch,
      default_branch_commit = excluded.default_branch_commit, scanned_at = excluded.scanned_at,
      updated_at = MAX(excluded.updated_at, ${LOCAL_REPOS_TABLE}.updated_at)
  `
  ).run(toLocalRepoDbEntity(repo))
}

/** Saves the user's order: `ids[0]` gets position 0. Repos not listed go back to unplaced (null). */
export function setLocalRepoPositions(db: Database.Database, ids: string[]): void {
  db.prepare(`UPDATE ${LOCAL_REPOS_TABLE} SET position = NULL`).run()
  const place = db.prepare(`UPDATE ${LOCAL_REPOS_TABLE} SET position = ? WHERE id = ?`)
  ids.forEach((id, index) => place.run(index, id))
}

export function hasLocalRepo(db: Database.Database, id: string): boolean {
  return !!db.prepare(`SELECT 1 FROM ${LOCAL_REPOS_TABLE} WHERE id = ?`).get(id)
}

/** Deletes repos by id. Their worktrees cascade. */
export function deleteLocalRepos(db: Database.Database, ids: string[]): void {
  const remove = db.prepare(`DELETE FROM ${LOCAL_REPOS_TABLE} WHERE id = ?`)
  for (const id of ids) remove.run(id)
}
