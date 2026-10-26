/** Refreshes only locally present and favorited repos, never enumerating the entire account. */
import type { GitSourcesSnapshot } from '../../../shared/git-sources/types'
import { getSnapshot as getLocalSnapshot } from '../../local-repos/sync'
import { getToken } from '../credentials'
import { findSource } from '../db/tables/git-sources/queries'
import { readCredential } from '../db/tables/credentials/queries'
import { listRepos, saveRepos } from '../db/tables/repos/queries'
import { listFavorites } from '../db/tables/favorites/queries'
import { getProvider } from '../providers'
import { notify } from '../sync'
export async function refresh(sourceId: string): Promise<GitSourcesSnapshot> {
  const source = findSource(sourceId)
  if (!source) throw new Error('Git source is disconnected.')
  const credential = readCredential(sourceId)
  const token = getToken(sourceId)
  const provider = getProvider(source.provider)
  const favorites = new Set(
    listFavorites()
      .filter((favorite) => favorite.sourceId === sourceId)
      .map((favorite) => favorite.externalId)
  )
  const names = new Set(
    listRepos()
      .filter((repo) => repo.sourceId === sourceId && favorites.has(repo.externalId))
      .map((repo) => repo.fullName)
  )
  for (const repo of getLocalSnapshot().repos)
    if (repo.provider === 'github' && repo.fullName) names.add(repo.fullName)
  const repos = [] as Awaited<ReturnType<typeof provider.readRepo>>[]
  for (const name of names)
    repos.push(await provider.readRepo(sourceId, token, name, new AbortController().signal))
  if (!findSource(sourceId) || readCredential(sourceId) !== credential)
    throw new Error('Git connection changed. Try again.')
  saveRepos(repos)
  return notify()
}
