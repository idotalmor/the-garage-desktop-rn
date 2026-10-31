/** URLs of release assets: the latest release's, a given base release's, and its page. */
import { releasesUrl } from '../utils/settings'

export function latestAssetUrl(name: string): string {
  return `${releasesUrl()}/latest/download/${name}`
}

export function assetUrl(baseVersion: string, name: string): string {
  return `${releasesUrl()}/download/v${baseVersion}/${encodeURIComponent(name)}`
}

export function releasePageUrl(version: string): string {
  return `${releasesUrl()}/tag/v${version}`
}
