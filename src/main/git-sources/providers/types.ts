/** Adapter contract; secret device codes and access tokens are main-only. */
import type {
  GitSource,
  GitSourceAuthorization,
  GitSourceRepo,
  GitSourceRepoPage
} from '../../../shared/git-sources/types'
export type DeviceAuthorization = GitSourceAuthorization & { deviceCode: string; interval: number }
export type ProviderCredential = { token: string; scopes: string[] }
export type GitSourceAdapter = {
  begin: (signal: AbortSignal) => Promise<DeviceAuthorization>
  authorize: (
    authorization: DeviceAuthorization,
    signal: AbortSignal
  ) => Promise<ProviderCredential>
  account: (
    token: string,
    signal: AbortSignal
  ) => Promise<Pick<GitSource, 'id' | 'externalId' | 'provider' | 'login' | 'avatarUrl'>>
  listRepos: (
    sourceId: string,
    token: string,
    page: number,
    signal: AbortSignal
  ) => Promise<GitSourceRepoPage>
  readRepo: (
    sourceId: string,
    token: string,
    fullName: string,
    signal: AbortSignal
  ) => Promise<GitSourceRepo>
}
