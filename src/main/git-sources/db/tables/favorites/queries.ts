/** Reads and idempotent writes of explicit app favorites. */
import { and, eq } from 'drizzle-orm'
import type { GitSourceFavorite } from '../../../../../shared/git-sources/types'
import { getDb } from '../../connection'
import { gitSourceFavorites } from './schema'
export function listFavorites(): GitSourceFavorite[] {
  return getDb().select().from(gitSourceFavorites).all()
}
export function setFavorite(sourceId: string, externalId: string, favorite: boolean): void {
  if (favorite)
    getDb().insert(gitSourceFavorites).values({ sourceId, externalId }).onConflictDoNothing().run()
  else
    getDb()
      .delete(gitSourceFavorites)
      .where(
        and(
          eq(gitSourceFavorites.sourceId, sourceId),
          eq(gitSourceFavorites.externalId, externalId)
        )
      )
      .run()
}
