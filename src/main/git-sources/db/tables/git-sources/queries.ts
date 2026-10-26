/** Account persistence and main-only encrypted credential access. */
import { eq } from 'drizzle-orm'
import type { GitSource } from '../../../../../shared/git-sources/types'
import { getDb, transaction } from '../../connection'
import { gitSources } from './schema'
import { saveCredential } from '../credentials/queries'

export function listSources(): GitSource[] {
  return getDb().select().from(gitSources).all()
}
export function findSource(id: string): GitSource | undefined {
  return getDb().select().from(gitSources).where(eq(gitSources.id, id)).get()
}
export function saveSource(source: GitSource, encryptedToken: string): void {
  transaction(() => {
    getDb()
      .insert(gitSources)
      .values(source)
      .onConflictDoUpdate({ target: gitSources.id, set: source })
      .run()
    saveCredential(source.id, encryptedToken)
  })
}
export function deleteSource(id: string): void {
  getDb().delete(gitSources).where(eq(gitSources.id, id)).run()
}
