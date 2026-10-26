/** Cancels browser authorization without changing an already connected account. */
import type { GitSourcesSnapshot } from '../../../shared/git-sources/types'
import { cancelAuthorization, notify } from '../sync'
export function cancelConnection(): GitSourcesSnapshot {
  cancelAuthorization()
  return notify()
}
