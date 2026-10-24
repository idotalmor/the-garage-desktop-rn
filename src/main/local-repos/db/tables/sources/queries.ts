/** Queries on `sources`. Each takes the open DB as its first argument. */
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import type { LocalReposDb } from '../../types'
import { sources, type SourceDbEntity } from './schema'

/** How many folder levels a new source is searched by default. */
export const DEFAULT_MAX_DEPTH = 4

export function listSourceDbEntities(db: LocalReposDb): SourceDbEntity[] {
  return db.select().from(sources).orderBy(sources.addedAt).all()
}

/** Inserts the paths that aren't saved yet. Returns the ids of the newly inserted rows. */
export function insertSources(
  db: LocalReposDb,
  paths: string[],
  maxDepth = DEFAULT_MAX_DEPTH
): string[] {
  if (paths.length === 0) return []
  const rows = paths.map((path) => ({ id: randomUUID(), path, maxDepth, addedAt: Date.now() }))
  return db
    .insert(sources)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: sources.id })
    .all()
    .map((row) => row.id)
}

export function deleteSource(db: LocalReposDb, id: string): void {
  db.delete(sources).where(eq(sources.id, id)).run()
}

/** Records the end of a scan: `error` is null when it succeeded. */
export function markSourceScanned(db: LocalReposDb, id: string, error: string | null): void {
  db.update(sources)
    .set({ lastScannedAt: Date.now(), lastError: error })
    .where(eq(sources.id, id))
    .run()
}
