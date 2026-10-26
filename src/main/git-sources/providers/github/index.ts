/** GitHub.com adapter; provider-specific API fields stop at this boundary. */
import type { GitSourceAdapter } from '../types'
import { begin, authorize } from './device-flow'
import { listRepos, readRepo } from './repos'
import { githubRequest } from './request'
export const github: GitSourceAdapter = {
  begin,
  authorize,
  listRepos,
  readRepo,
  account: async (token, signal) => {
    const user = await githubRequest<{ id: number; login: string; avatar_url: string }>('/user', {
      token,
      signal
    })
    if (!Number.isSafeInteger(user.id) || !user.login)
      throw new Error('GitHub returned an invalid account.')
    return {
      id: `github:${user.id}`,
      externalId: String(user.id),
      provider: 'github',
      login: user.login,
      avatarUrl: user.avatar_url
    }
  }
}
