/** Adds folders as sources (resolving symlinks) and queues a scan of the ones that are new. */
import { promises as fs } from 'fs'
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import * as db from '../db'
import { enqueueScan, getSnapshot } from '../scan-service'

export async function addSources(paths: string[]): Promise<LocalReposSnapshot> {
  if (paths.length === 0) return getSnapshot()
  const realPaths = await Promise.all(paths.map((path) => fs.realpath(path).catch(() => path)))
  const added = db.insertSources(realPaths)
  if (added.length > 0) enqueueScan(added.map((source) => source.id))
  return getSnapshot()
}
