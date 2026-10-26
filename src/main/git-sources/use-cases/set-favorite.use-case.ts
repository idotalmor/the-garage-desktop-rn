/** Only cached accessible repos can be favorited; local visibility is independent of favorites. */
import type { GitSourcesSnapshot } from '../../../shared/git-sources/types'
import { findRepo } from '../db/tables/repos/queries'
import { setFavorite as saveFavorite } from '../db/tables/favorites/queries'
import { notify } from '../sync'
export function setFavorite(
  sourceId: string,
  externalId: string,
  favorite: boolean
): GitSourcesSnapshot {
  if (!findRepo(sourceId, externalId))
    throw new Error('Browse this account’s repos before selecting a favorite.')
  saveFavorite(sourceId, externalId, favorite)
  return notify()
}
