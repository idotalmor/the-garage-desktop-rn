import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import Database from 'better-sqlite3'
import type {
  CommitSummary,
  GitProvider,
  GitRemote,
  LocalRepository,
  LocalWorktree,
  ScanRoot
} from '../../shared/worktrees/types'

export const DEFAULT_MAX_DEPTH = 4

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (db) return db

  const dbDir = join(app.getPath('home'), '.devflow')
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

  db = new Database(join(dbDir, 'worktrees.db'))
  db.pragma('journal_mode = DELETE')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS scan_roots (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      max_depth INTEGER NOT NULL,
      added_at INTEGER NOT NULL,
      last_scanned_at INTEGER,
      last_error TEXT
    );
    CREATE TABLE IF NOT EXISTS local_repos (
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
    CREATE INDEX IF NOT EXISTS idx_local_repos_slug ON local_repos(slug);
    CREATE TABLE IF NOT EXISTS local_repo_roots (
      repo_id TEXT NOT NULL REFERENCES local_repos(id) ON DELETE CASCADE,
      root_id TEXT NOT NULL REFERENCES scan_roots(id) ON DELETE CASCADE,
      PRIMARY KEY (repo_id, root_id)
    );
    CREATE TABLE IF NOT EXISTS local_worktrees (
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
    CREATE INDEX IF NOT EXISTS idx_local_worktrees_repo ON local_worktrees(repo_id);
    CREATE INDEX IF NOT EXISTS idx_local_worktrees_branch ON local_worktrees(branch);
  `)

  app.on('before-quit', () => db?.close())
  return db
}

type RootRow = {
  id: string
  path: string
  max_depth: number
  added_at: number
  last_scanned_at: number | null
  last_error: string | null
}

type RepoRow = {
  id: string
  name: string
  common_dir: string
  is_bare: number
  provider: string
  full_name: string | null
  slug: string | null
  remote_url: string | null
  remotes: string
  default_branch: string | null
  default_branch_commit: string | null
  scanned_at: number
}

type WorktreeRow = {
  path: string
  repo_id: string
  position: number
  name: string
  is_main: number
  branch: string | null
  is_detached: number
  head: string | null
  is_locked: number
  is_prunable: number
  upstream: string | null
  ahead: number | null
  behind: number | null
  changed_files: number
  last_commit: string | null
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function toRoot(row: RootRow): ScanRoot {
  return {
    id: row.id,
    path: row.path,
    maxDepth: row.max_depth,
    addedAt: row.added_at,
    lastScannedAt: row.last_scanned_at,
    lastError: row.last_error
  }
}

function toWorktree(row: WorktreeRow): LocalWorktree {
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

export function listRoots(): ScanRoot[] {
  const rows = getDb().prepare('SELECT * FROM scan_roots ORDER BY added_at').all() as RootRow[]
  return rows.map(toRoot)
}

export function addRoots(paths: string[], maxDepth = DEFAULT_MAX_DEPTH): ScanRoot[] {
  const database = getDb()
  const insert = database.prepare(
    'INSERT OR IGNORE INTO scan_roots (id, path, max_depth, added_at) VALUES (?, ?, ?, ?)'
  )
  const added: string[] = []
  database.transaction(() => {
    for (const path of paths) {
      const id = randomUUID()
      if (insert.run(id, path, maxDepth, Date.now()).changes > 0) added.push(id)
    }
  })()
  return listRoots().filter((root) => added.includes(root.id))
}

export function removeRoot(id: string): void {
  const database = getDb()
  database.transaction(() => {
    database.prepare('DELETE FROM scan_roots WHERE id = ?').run(id)
    deleteOrphanRepos(database)
  })()
}

export function markRootError(id: string, error: string): void {
  getDb()
    .prepare('UPDATE scan_roots SET last_scanned_at = ?, last_error = ? WHERE id = ?')
    .run(Date.now(), error, id)
}

/** Replaces everything known about one root with the latest scan result. */
export function saveRootScan(rootId: string, repositories: LocalRepository[]): void {
  const database = getDb()
  const upsertRepo = database.prepare(`
    INSERT INTO local_repos (
      id, name, common_dir, is_bare, provider, full_name, slug, remote_url, remotes,
      default_branch, default_branch_commit, scanned_at
    ) VALUES (
      @id, @name, @commonDir, @isBare, @provider, @fullName, @slug, @remoteUrl, @remotes,
      @defaultBranch, @defaultBranchCommit, @scannedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, is_bare = excluded.is_bare, provider = excluded.provider,
      full_name = excluded.full_name, slug = excluded.slug, remote_url = excluded.remote_url,
      remotes = excluded.remotes, default_branch = excluded.default_branch,
      default_branch_commit = excluded.default_branch_commit, scanned_at = excluded.scanned_at
  `)
  const insertWorktree = database.prepare(`
    INSERT OR REPLACE INTO local_worktrees (
      path, repo_id, position, name, is_main, branch, is_detached, head, is_locked,
      is_prunable, upstream, ahead, behind, changed_files, last_commit
    ) VALUES (
      @path, @repoId, @position, @name, @isMain, @branch, @isDetached, @head, @isLocked,
      @isPrunable, @upstream, @ahead, @behind, @changedFiles, @lastCommit
    )
  `)

  database.transaction(() => {
    database.prepare('DELETE FROM local_repo_roots WHERE root_id = ?').run(rootId)
    for (const repo of repositories) {
      upsertRepo.run({
        id: repo.id,
        name: repo.name,
        commonDir: repo.commonDir,
        isBare: repo.isBare ? 1 : 0,
        provider: repo.provider,
        fullName: repo.fullName,
        slug: repo.slug,
        remoteUrl: repo.remoteUrl,
        remotes: JSON.stringify(repo.remotes),
        defaultBranch: repo.defaultBranch,
        defaultBranchCommit: repo.defaultBranchCommit
          ? JSON.stringify(repo.defaultBranchCommit)
          : null,
        scannedAt: repo.scannedAt
      })
      database
        .prepare('INSERT OR IGNORE INTO local_repo_roots (repo_id, root_id) VALUES (?, ?)')
        .run(repo.id, rootId)
      database.prepare('DELETE FROM local_worktrees WHERE repo_id = ?').run(repo.id)
      repo.worktrees.forEach((tree, position) =>
        insertWorktree.run({
          path: tree.path,
          repoId: repo.id,
          position,
          name: tree.name,
          isMain: tree.isMain ? 1 : 0,
          branch: tree.branch,
          isDetached: tree.isDetached ? 1 : 0,
          head: tree.head,
          isLocked: tree.isLocked ? 1 : 0,
          isPrunable: tree.isPrunable ? 1 : 0,
          upstream: tree.upstream,
          ahead: tree.ahead,
          behind: tree.behind,
          changedFiles: tree.changedFiles,
          lastCommit: tree.lastCommit ? JSON.stringify(tree.lastCommit) : null
        })
      )
    }
    database
      .prepare('UPDATE scan_roots SET last_scanned_at = ?, last_error = NULL WHERE id = ?')
      .run(Date.now(), rootId)
    deleteOrphanRepos(database)
  })()
}

function deleteOrphanRepos(database: Database.Database): void {
  database.exec(
    'DELETE FROM local_repos WHERE id NOT IN (SELECT DISTINCT repo_id FROM local_repo_roots)'
  )
}

export function listRepositories(): LocalRepository[] {
  const database = getDb()
  const repos = database.prepare('SELECT * FROM local_repos ORDER BY name').all() as RepoRow[]
  const links = database.prepare('SELECT repo_id, root_id FROM local_repo_roots').all() as {
    repo_id: string
    root_id: string
  }[]
  const trees = database
    .prepare('SELECT * FROM local_worktrees ORDER BY repo_id, position')
    .all() as WorktreeRow[]

  return repos.map((row) => ({
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
    rootIds: links.filter((link) => link.repo_id === row.id).map((link) => link.root_id),
    worktrees: trees.filter((tree) => tree.repo_id === row.id).map(toWorktree),
    scannedAt: row.scanned_at
  }))
}
