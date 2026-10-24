/**
 * Scans sources (all, or the given ids): finds their repos, saves them, and deletes repos that are
 * gone. Run on `scan-service`'s queue, for full scans and for quiet rescans after a file change.
 */
import { promises as fs } from 'fs'
import type { ScannedRepository, ScanProgress } from '../../../shared/local-repos/types'
import * as db from '../db'
import { scanSource } from '../scanner/scan-source'

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
  const sources = db.listSources().filter((source) => !sourceIds || sourceIds.includes(source.id))
  for (const source of sources) {
    try {
      const stats = await fs.stat(source.path)
      if (!stats.isDirectory()) throw new Error('Not a folder')
      const repositories = await scanSource(source.path, source.maxDepth, options.onProgress)
      saveSourceResult(source.id, repositories, null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[local-repos] scan failed for', source.path, message)
      saveSourceResult(source.id, [], message)
    }
    options.onSourceScanned?.()
  }
  await deleteMissingRepositories()
}

/**
 * Saves what one source found. Found repos are upserted (by their git dir, so never twice).
 * Repos this source covers but no longer finds are deleted, unless another source also covers them.
 */
function saveSourceResult(
  sourceId: string,
  repositories: ScannedRepository[],
  error: string | null
): void {
  db.transaction(() => {
    for (const repo of repositories) db.saveRepository(repo)
    db.markSourceScanned(sourceId, error)
    const found = new Set(repositories.map((repo) => repo.id))
    const stale = db
      .listRepositories()
      .filter((repo) => !found.has(repo.id) && repo.sourceIds.every((id) => id === sourceId))
    db.deleteRepositories(stale.map((repo) => repo.id))
  })
}

/** Deletes repos whose git dir is gone, including ones another source still covers. */
async function deleteMissingRepositories(): Promise<void> {
  const missing: string[] = []
  for (const repo of db.listRepositories()) {
    const exists = await fs.access(repo.commonDir).then(
      () => true,
      () => false
    )
    if (!exists) missing.push(repo.id)
  }
  db.deleteRepositories(missing)
}
