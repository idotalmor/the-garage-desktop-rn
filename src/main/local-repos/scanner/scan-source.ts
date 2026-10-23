/**
 * Scans one source: discover candidates → group them by repo → inspect each repo.
 *
 * Several candidates can belong to one repo (a clone and its linked worktrees), so they are
 * grouped by their shared git directory before inspecting.
 */
import type { ScanProgress, ScannedRepository } from '../../../shared/local-repos/types'
import { resolveCommonDir } from '../git/queries'
import { GIT_CONCURRENCY, mapLimit } from '../utils/concurrency'
import { discover, type Candidate } from './discover'
import { inspectRepository } from './inspect'

export async function scanSource(
  sourcePath: string,
  maxDepth: number,
  onProgress?: (progress: ScanProgress) => void
): Promise<ScannedRepository[]> {
  const progress: ScanProgress = { sourcePath, dirsVisited: 0, reposFound: 0 }
  const candidates = await discover(sourcePath, maxDepth, progress, onProgress)

  const byCommonDir = new Map<string, Candidate>()
  await mapLimit(candidates, GIT_CONCURRENCY, async (candidate) => {
    const commonDir = await resolveCommonDir(candidate.dir)
    if (commonDir && !byCommonDir.has(commonDir)) byCommonDir.set(commonDir, candidate)
  })

  const repositories = (
    await mapLimit([...byCommonDir.entries()], GIT_CONCURRENCY, ([commonDir, candidate]) =>
      inspectRepository(commonDir, candidate).catch(() => null)
    )
  ).filter((repo): repo is ScannedRepository => repo !== null)

  progress.reposFound = repositories.length
  onProgress?.({ ...progress })
  return repositories
}
