/** Single-table queries on `local_repos`. Each takes the open DB as its first argument. */
import type Database from 'better-sqlite3'
import type { ScannedRepository } from '../../../../../shared/local-repos/types'
import { toLocalRepoDbEntity } from './mapper'
import { LOCAL_REPOS_TABLE, type LocalRepoDbEntity } from './schema'

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
