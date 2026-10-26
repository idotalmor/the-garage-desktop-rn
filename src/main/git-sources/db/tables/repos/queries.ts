/** Repo cache queries; upserts preserve stable ids across renames. */
import { and, eq } from 'drizzle-orm'
import type { GitSourceRepo } from '../../../../../shared/git-sources/types'
import { getDb, transaction } from '../../connection'
import { gitSourceRepos } from './schema'
export function listRepos(): GitSourceRepo[] {
  return getDb().select().from(gitSourceRepos).all()
}
export function findRepo(sourceId: string, externalId: string): GitSourceRepo | undefined {
  return getDb()
    .select()
    .from(gitSourceRepos)
    .where(and(eq(gitSourceRepos.sourceId, sourceId), eq(gitSourceRepos.externalId, externalId)))
    .get()
}
export function saveRepos(repos: GitSourceRepo[]): void {
  transaction(() => {
    for (const repo of repos)
      getDb()
        .insert(gitSourceRepos)
        .values(repo)
        .onConflictDoUpdate({
          target: [gitSourceRepos.sourceId, gitSourceRepos.externalId],
          set: repo
        })
        .run()
  })
}
