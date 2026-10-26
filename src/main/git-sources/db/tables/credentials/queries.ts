/** Encrypted token access for main only; never used to build snapshots. */
import { eq } from 'drizzle-orm'
import { getDb } from '../../connection'
import { gitSourceCredentials } from './schema'
export function readCredential(sourceId: string): string | undefined {
  return getDb()
    .select()
    .from(gitSourceCredentials)
    .where(eq(gitSourceCredentials.sourceId, sourceId))
    .get()?.encryptedToken
}
export function saveCredential(sourceId: string, encryptedToken: string): void {
  getDb()
    .insert(gitSourceCredentials)
    .values({ sourceId, encryptedToken })
    .onConflictDoUpdate({ target: gitSourceCredentials.sourceId, set: { encryptedToken } })
    .run()
}
