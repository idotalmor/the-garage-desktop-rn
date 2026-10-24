/** Reads the configured remotes. */
import type { GitRemote } from '../../../shared/git/types'
import { parseRemoteUrl } from '../parsers/remote-url'
import { parseRemoteConfig } from '../parsers/remotes'
import { gitOrNull } from '../run'

/** All configured remotes, with their URLs normalized to host/owner/repo. */
export async function readRemotes(dir: string): Promise<GitRemote[]> {
  const output = await gitOrNull(dir, ['config', '--get-regexp', '^remote\\..*\\.url$'])
  if (!output) return []
  return parseRemoteConfig(output).map(({ name, url }) => ({ name, url, ...parseRemoteUrl(url) }))
}
