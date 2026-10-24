/**
 * Scans sources (all, or the given ids): finds their repos, saves them, and deletes repos that are
 * gone. Run on `scan-service`'s queue, for full scans and for quiet rescans after a file change.
 */
import { promises as fs } from 'fs'
import type { ScannedRepo, ScanProgress } from '../../../shared/local-repos/types'
import { transaction } from '../db/connection'
import { deleteRepos, listRepos, saveRepo } from '../db/tables/local-repos/queries'
import { listSources, markSourceScanned } from '../db/tables/sources/queries'
import { scanSource } from '../scanner/scan-source'
import { coveringSourceIds } from '../utils/coverage'

export type ScanSourcesOptions = {
  /** Called while a source is walked (full scans only, to show progress). */
  onProgress?: (progress: ScanProgress) => void
  /** Called after each source is saved. */
  onSourceScanned?: () => void
}

export async function scanSources(
  sourceIds?: string[],
  options: ScanSourcesOptions = {}
): Promise<void> {
  const sources = listSources().filter((source) => !sourceIds || sourceIds.includes(source.id))
  for (const source of sources) {
    try {
      const stats = await fs.stat(source.path)
      if (!stats.isDirectory()) throw new Error('Not a folder')
      const repos = await scanSource(source.path, source.maxDepth, options.onProgress)
      saveSourceResult(source.id, repos, null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[local-repos] scan failed for', source.path, message)
      saveSourceResult(source.id, [], message)
    }
    options.onSourceScanned?.()
  }
  await deleteMissingRepos()
}

/**
 * Saves what one source found. Found repos are upserted (by their git dir, so never twice).
 * Repos this source covers but no longer finds are deleted, unless another source also covers them.
 */
function saveSourceResult(sourceId: string, repos: ScannedRepo[], error: string | null): void {
  transaction(() => {
    for (const repo of repos) saveRepo(repo)
    markSourceScanned(sourceId, error)
    const found = new Set(repos.map((repo) => repo.id))
    const sources = listSources()
    const stale = listRepos().filter(
      (repo) =>
        !found.has(repo.id) && coveringSourceIds(repo, sources).every((id) => id === sourceId)
    )
    deleteRepos(stale.map((repo) => repo.id))
  })
}

/** Deletes repos whose git dir is gone, including ones another source still covers. */
async function deleteMissingRepos(): Promise<void> {
  const missing: string[] = []
  for (const repo of listRepos()) {
    const exists = await fs.access(repo.commonDir).then(
      () => true,
      () => false
    )
    if (!exists) missing.push(repo.id)
  }
  deleteRepos(missing)
}
