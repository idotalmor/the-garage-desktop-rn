/**
 * Path rules for which sources cover which repos, shared by the DB, the use cases and the watchers.
 *
 * Which sources "cover" a repo is not stored: it is worked out from paths. A source covers a repo
 * when the repo's git dir or one of its existing checkouts is inside the folder.
 */
import { sep } from 'path'
import type { LocalRepo, LocalWorktree, Source } from '../../../shared/local-repos/types'

export function isInside(path: string, dir: string): boolean {
  return path === dir || path.startsWith(dir.endsWith(sep) ? dir : dir + sep)
}

export function coveringSourceIds(
  repo: { commonDir: string; worktrees: Pick<LocalWorktree, 'path' | 'isPrunable'>[] },
  sources: Source[]
): string[] {
  const paths = [
    repo.commonDir,
    ...repo.worktrees.filter((tree) => !tree.isPrunable).map((tree) => tree.path)
  ]
  return sources
    .filter((folder) => paths.some((path) => isInside(path, folder.path)))
    .map((folder) => folder.id)
}

/** Repos no source covers anymore; these get deleted. */
export function uncoveredRepoIds(repos: LocalRepo[], sources: Source[]): string[] {
  return repos
    .filter((repo) => coveringSourceIds(repo, sources).length === 0)
    .map((repo) => repo.id)
}
