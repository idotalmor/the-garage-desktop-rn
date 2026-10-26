/** Fetches a bounded catalog page, rejecting stale results after disconnect or reconnection. */
import type { GitSourceRepoPage } from '../../../shared/git-sources/types'
import { getToken } from '../credentials'
import { findSource } from '../db/tables/git-sources/queries'
import { readCredential } from '../db/tables/credentials/queries'
import { saveRepos } from '../db/tables/repos/queries'
import { getProvider } from '../providers'
import { notify } from '../sync'
export async function listRepos(sourceId: string, page: number): Promise<GitSourceRepoPage> {
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw new Error('Invalid repo page.')
  const source = findSource(sourceId)
  if (!source) throw new Error('Git source is disconnected.')
  const credential = readCredential(sourceId)
  const result = await getProvider(source.provider).listRepos(
    sourceId,
    getToken(sourceId),
    page,
    new AbortController().signal
  )
  if (!findSource(sourceId) || readCredential(sourceId) !== credential)
    throw new Error('Git connection changed. Try again.')
  saveRepos(result.repos)
  notify()
  return result
}
