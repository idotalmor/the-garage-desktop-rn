/** Questions about branches. */
import { gitOrNull } from '../run'

/**
 * The repo's default branch: what `<remote>/HEAD` points to, else the first of
 * main/master/develop/trunk that exists. `defaultRef` is the ref to read its last commit from.
 */
export async function resolveDefaultBranch(
  dir: string,
  remote: string | undefined
): Promise<{ defaultBranch: string | null; defaultRef: string | null }> {
  if (remote) {
    const symbolic = await gitOrNull(dir, [
      'symbolic-ref',
      '--quiet',
      '--short',
      `refs/remotes/${remote}/HEAD`
    ])
    const ref = symbolic?.trim()
    if (ref) return { defaultBranch: ref.slice(remote.length + 1), defaultRef: ref }
  }
  for (const branch of ['main', 'master', 'develop', 'trunk']) {
    const candidates = remote ? [`refs/remotes/${remote}/${branch}`] : []
    candidates.push(`refs/heads/${branch}`)
    for (const ref of candidates) {
      const exists = await gitOrNull(dir, ['rev-parse', '--verify', '--quiet', ref])
      if (exists) return { defaultBranch: branch, defaultRef: ref }
    }
  }
  return { defaultBranch: null, defaultRef: null }
}
