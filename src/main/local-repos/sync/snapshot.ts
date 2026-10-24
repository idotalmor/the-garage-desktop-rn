/** The snapshot the UI renders (sources, repos, scan status) and the subscribers that receive it. */
import { EventEmitter } from 'events'
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import { listRepos } from '../db/tables/local-repos/queries'
import { listSources } from '../db/tables/sources/queries'
import { scanStatus } from './job-queue'

type Listener = (snapshot: LocalReposSnapshot) => void

const events = new EventEmitter()

export function getSnapshot(): LocalReposSnapshot {
  return { sources: listSources(), repos: listRepos(), ...scanStatus() }
}

/** Calls `listener` with a new snapshot whenever anything changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  events.on('changed', listener)
  return () => events.off('changed', listener)
}

/** Sends the current snapshot to every subscriber. */
export function notify(): void {
  events.emit('changed', getSnapshot())
}
