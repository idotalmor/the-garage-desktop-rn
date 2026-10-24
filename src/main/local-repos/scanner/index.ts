/**
 * Scanner entry point. `scanSource` scans one source: find repo folders → group them by repo →
 * read each repo. `rereadRepo` re-reads one stored repo after a change. The step files are internal.
 *
 * Several folders can belong to one repo (a clone and its linked worktrees), so they are grouped
 * by their shared git directory before reading.
 */
import type { ScanProgress, ScannedRepo } from '../../../shared/local-repos/types'
import { resolveCommonDir } from '../../git'
import { GIT_CONCURRENCY, mapLimit } from './concurrency'
import { findRepoFolders, type RepoFolder } from './find-repo-folders'
import { readRepo } from './read-repo'

export { rereadRepo } from './read-repo'
export { ALLOWED_HIDDEN_DIRS, SKIP_DIRS } from './find-repo-folders'

export async function scanSource(
  sourcePath: string,
  maxDepth: number,
  onProgress?: (progress: ScanProgress) => void
): Promise<ScannedRepo[]> {
  const progress: ScanProgress = { sourcePath, dirsVisited: 0, reposFound: 0 }
  const folders = await findRepoFolders(sourcePath, maxDepth, progress, onProgress)

  const byCommonDir = new Map<string, RepoFolder>()
  await mapLimit(folders, GIT_CONCURRENCY, async (folder) => {
    const commonDir = await resolveCommonDir(folder.dir)
    if (commonDir && !byCommonDir.has(commonDir)) byCommonDir.set(commonDir, folder)
  })

  const repos = (
    await mapLimit([...byCommonDir.entries()], GIT_CONCURRENCY, ([commonDir, folder]) =>
      readRepo(commonDir, folder).catch(() => null)
    )
  ).filter((repo): repo is ScannedRepo => repo !== null)

  progress.reposFound = repos.length
  onProgress?.({ ...progress })
  return repos
}
