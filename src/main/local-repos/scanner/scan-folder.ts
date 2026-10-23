/**
 * Scans one scan folder: discover candidates → group them by repo → inspect each repo.
 *
 * Several candidates can belong to one repo (a clone and its linked worktrees), so they are
 * grouped by their shared git directory before inspecting.
 */
import type { LocalRepository, ScanProgress } from '../../../shared/local-repos/types'
import { resolveCommonDir } from '../git/queries'
import { GIT_CONCURRENCY, mapLimit } from '../utils/concurrency'
import { discover, type Candidate } from './discover'
import { inspectRepository } from './inspect'

export async function scanFolder(
  scanFolderPath: string,
  scanFolderId: string,
  maxDepth: number,
  onProgress?: (progress: ScanProgress) => void
): Promise<LocalRepository[]> {
  const progress: ScanProgress = { scanFolderPath, dirsVisited: 0, reposFound: 0 }
  const candidates = await discover(scanFolderPath, maxDepth, progress, onProgress)

  const byCommonDir = new Map<string, Candidate>()
  await mapLimit(candidates, GIT_CONCURRENCY, async (candidate) => {
    const commonDir = await resolveCommonDir(candidate.dir)
    if (commonDir && !byCommonDir.has(commonDir)) byCommonDir.set(commonDir, candidate)
  })

  const repositories = (
    await mapLimit([...byCommonDir.entries()], GIT_CONCURRENCY, ([commonDir, candidate]) =>
      inspectRepository(commonDir, candidate, scanFolderId).catch(() => null)
    )
  ).filter((repo): repo is LocalRepository => repo !== null)

  progress.reposFound = repositories.length
  onProgress?.({ ...progress })
  return repositories
}
