/** Reads and writes of `sources`. Rows come back as the app's `Source`. */
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import type { Source } from '../../../../../shared/local-repos/types'
import { getDb } from '../../connection'
import { sources } from './schema'

/** How many folder levels a new source is searched by default. */
export const DEFAULT_MAX_DEPTH = 4

/** Every source, oldest first. */
export function listSources(): Source[] {
  return getDb().select().from(sources).orderBy(sources.addedAt).all()
}

/** Saves the paths that aren't saved yet. Returns only the new sources. */
export function insertSources(paths: string[], maxDepth = DEFAULT_MAX_DEPTH): Source[] {
  if (paths.length === 0) return []
  const rows = paths.map((path) => ({ id: randomUUID(), path, maxDepth, addedAt: Date.now() }))
  return getDb().insert(sources).values(rows).onConflictDoNothing().returning().all()
}

export function deleteSource(id: string): void {
  getDb().delete(sources).where(eq(sources.id, id)).run()
}

/** Records the end of a scan: `error` is null when it succeeded. */
export function markSourceScanned(id: string, error: string | null): void {
  getDb()
    .update(sources)
    .set({ lastScannedAt: Date.now(), lastError: error })
    .where(eq(sources.id, id))
    .run()
}
