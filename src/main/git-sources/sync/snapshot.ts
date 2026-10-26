/** Secret-free snapshots and in-process subscriptions, independent of Electron windows. */
import { EventEmitter } from 'events'
import type { GitSourcesSnapshot } from '../../../shared/git-sources/types'
import { listSources } from '../db/tables/git-sources/queries'
import { listRepos } from '../db/tables/repos/queries'
import { listFavorites } from '../db/tables/favorites/queries'
import { currentAuthorization } from './authorization'
const events = new EventEmitter()
export function getSnapshot(): GitSourcesSnapshot {
  const authorization = currentAuthorization()?.authorization
  return {
    sources: listSources(),
    repos: listRepos(),
    favorites: listFavorites(),
    authorization: authorization
      ? {
          userCode: authorization.userCode,
          verificationUri: authorization.verificationUri,
          expiresAt: authorization.expiresAt
        }
      : null
  }
}
export function notify(): GitSourcesSnapshot {
  const snapshot = getSnapshot()
  events.emit('changed', snapshot)
  return snapshot
}
export function subscribe(listener: (snapshot: GitSourcesSnapshot) => void): () => void {
  events.on('changed', listener)
  return () => {
    events.off('changed', listener)
  }
}
