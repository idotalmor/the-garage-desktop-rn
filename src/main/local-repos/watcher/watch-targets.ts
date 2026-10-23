/**
 * Pure rules for live updates: which folders to watch, and what a changed path means.
 *
 * - `watchTargets`: every source, plus repo `.git` dirs and checkouts that live outside all
 *   sources (e.g. a worktree in `~/elsewhere`). Nested paths are dropped because a recursive
 *   watcher on the parent already covers them.
 * - `classifyChange`: a path inside a known checkout or `.git` dir means "re-check that repo"; any
 *   other path inside a source means "rescan that folder" (a clone may have appeared or gone).
 *   Noise (`node_modules`, build output, `.git/objects`, lock files…) is ignored.
 */
import { basename, sep } from 'path'
import type { LocalRepository, Source } from '../../../shared/local-repos/types'
import { ALLOWED_HIDDEN_DIRS, SKIP_DIRS } from '../scanner/discover'
import { isInside } from '../utils/paths'

/** What a changed path requires. */
export type Change = { kind: 'repo'; repoId: string } | { kind: 'source'; sourceIds: string[] }

export function watchTargets(sources: Source[], repositories: LocalRepository[]): string[] {
  const paths = [
    ...sources.map((folder) => folder.path),
    ...repositories.flatMap((repo) => [
      repo.commonDir,
      ...repo.worktrees.filter((tree) => !tree.isPrunable).map((tree) => tree.path)
    ])
  ]
  const targets: string[] = []
  for (const path of [...new Set(paths)].sort((a, b) => a.length - b.length)) {
    if (!targets.some((target) => isInside(path, target))) targets.push(path)
  }
  return targets
}

export function classifyChange(
  path: string,
  sources: Source[],
  repositories: LocalRepository[]
): Change | null {
  if (basename(path) === '.DS_Store') return null

  let match: { repoId: string; base: string; isGitDir: boolean } | null = null
  for (const repo of repositories) {
    const bases = [
      { base: repo.commonDir, isGitDir: true },
      ...repo.worktrees.map((tree) => ({ base: tree.path, isGitDir: false }))
    ]
    for (const { base, isGitDir } of bases) {
      if (isInside(path, base) && (!match || base.length > match.base.length)) {
        match = { repoId: repo.id, base, isGitDir }
      }
    }
  }

  if (match) {
    const parts = relativeParts(path, match.base)
    const gitParts = match.isGitDir ? parts : parts[0] === '.git' ? parts.slice(1) : null
    const ignored = gitParts ? isGitNoise(gitParts) : parts.some((part) => SKIP_DIRS.has(part))
    return ignored ? null : { kind: 'repo', repoId: match.repoId }
  }

  const sourceIds = sources
    .filter(
      (folder) =>
        isInside(path, folder.path) &&
        couldContainNewRepo(relativeParts(path, folder.path), folder.maxDepth)
    )
    .map((folder) => folder.id)
  return sourceIds.length > 0 ? { kind: 'source', sourceIds } : null
}

function relativeParts(path: string, base: string): string[] {
  return path === base ? [] : path.slice(base.length + 1).split(sep)
}

/** Git internals that change constantly without changing anything the UI shows. */
function isGitNoise(parts: string[]): boolean {
  return parts.includes('objects') || parts.includes('logs') || !!parts.at(-1)?.endsWith('.lock')
}

/** Same limits as `discover`: deep enough, and not in a skipped or hidden folder. */
function couldContainNewRepo(parts: string[], maxDepth: number): boolean {
  if (parts.length > maxDepth + 2) return false
  return parts
    .slice(0, -1)
    .every(
      (part) =>
        part === '.git' ||
        (!SKIP_DIRS.has(part) && (!part.startsWith('.') || ALLOWED_HIDDEN_DIRS.has(part)))
    )
}
