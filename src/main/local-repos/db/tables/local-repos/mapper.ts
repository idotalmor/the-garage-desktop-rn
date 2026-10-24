/** Converts between a `local_repos` row and the app's `LocalRepository` / `ScannedRepository`. */
import type { GitProvider } from '../../../../../shared/git/types'
import type {
  LocalRepository,
  LocalWorktree,
  ScannedRepository
} from '../../../../../shared/local-repos/types'
import { parseJson, toJson } from '../../../../sqlite'
import type { LocalRepoDbEntity } from './schema'

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
