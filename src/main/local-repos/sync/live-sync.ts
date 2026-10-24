/**
 * Keeps the DB in sync with the disk while the app runs. Watches every source (plus repo git dirs
 * and checkouts outside them); a change inside a known repo queues a refresh of that repo, any
 * other change in a source queues a quiet rescan of it. Changes are batched until things are quiet
 * for 1s (at most 5s, e.g. during a long `npm install`).
 */
import debounce from 'lodash.debounce'
import type { LocalRepo, Source } from '../../../shared/local-repos/types'
import { listRepos } from '../db/tables/local-repos/queries'
import { listSources } from '../db/tables/sources/queries'
import { refreshRepos } from '../use-cases/refresh-repos.use-case'
import { scanSources } from '../use-cases/scan-sources.use-case'
import { closeAllWatchers, syncWatchers } from '../watcher/fs-watchers'
import { classifyChange, watchTargets } from '../watcher/watch-targets'
import { enqueue } from './job-queue'

const CHANGE_QUIET_MS = 1000
const CHANGE_MAX_WAIT_MS = 5000

/** What the watchers currently cover, cached so file events don't hit the DB. */
let watched: { sources: Source[]; repos: LocalRepo[] } = { sources: [], repos: [] }
const changedRepoIds = new Set<string>()
const changedSourceIds = new Set<string>()
const flushChangesSoon = debounce(flushChanges, CHANGE_QUIET_MS, { maxWait: CHANGE_MAX_WAIT_MS })

/** Points the watchers at the current sources and repos. Run after every DB change. */
export function syncWatching(): void {
  watched = { sources: listSources(), repos: listRepos() }
  syncWatchers(watchTargets(watched.sources, watched.repos), onPathChanged)
}

/** Drops file changes that are waiting to be processed (e.g. before a reset). */
export function cancelPendingChanges(): void {
  flushChangesSoon.cancel()
  changedRepoIds.clear()
  changedSourceIds.clear()
}

export function stopWatching(): void {
  cancelPendingChanges()
  closeAllWatchers()
}

function onPathChanged(path: string): void {
  const change = classifyChange(path, watched.sources, watched.repos)
  if (!change) return
  if (change.kind === 'repo') changedRepoIds.add(change.repoId)
  else change.sourceIds.forEach((id) => changedSourceIds.add(id))
  flushChangesSoon()
}

function flushChanges(): void {
  const sourceIds = [...changedSourceIds]
  const repoIds = [...changedRepoIds]
  changedSourceIds.clear()
  changedRepoIds.clear()
  if (sourceIds.length > 0) enqueue(() => scanSources(sourceIds), false)
  if (repoIds.length > 0) enqueue(() => refreshRepos(repoIds), false)
}
