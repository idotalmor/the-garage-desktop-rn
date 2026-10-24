/**
 * Scans one source: discover candidates → group them by repo → inspect each repo.
 *
 * Several candidates can belong to one repo (a clone and its linked worktrees), so they are
 * grouped by their shared git directory before inspecting.
 */
import type { ScanProgress, ScannedRepo } from '../../../shared/local-repos/types'
import { resolveCommonDir } from '../../git'
import { GIT_CONCURRENCY, mapLimit } from '../utils/concurrency'
import { discover, type Candidate } from './discover'
import { inspectRepo } from './inspect'

export async function scanSource(
  sourcePath: string,
  maxDepth: number,
  onProgress?: (progress: ScanProgress) => void
): Promise<ScannedRepo[]> {
  const progress: ScanProgress = { sourcePath, dirsVisited: 0, reposFound: 0 }
  const candidates = await discover(sourcePath, maxDepth, progress, onProgress)

  const byCommonDir = new Map<string, Candidate>()
  await mapLimit(candidates, GIT_CONCURRENCY, async (candidate) => {
    const commonDir = await resolveCommonDir(candidate.dir)
    if (commonDir && !byCommonDir.has(commonDir)) byCommonDir.set(commonDir, candidate)
  })

  const repos = (
    await mapLimit([...byCommonDir.entries()], GIT_CONCURRENCY, ([commonDir, candidate]) =>
      inspectRepo(commonDir, candidate).catch(() => null)
    )
  ).filter((repo): repo is ScannedRepo => repo !== null)

  progress.reposFound = repos.length
  onProgress?.({ ...progress })
  return repos
}
