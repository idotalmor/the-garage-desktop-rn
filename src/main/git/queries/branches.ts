/** Questions about branches. */
import { parseBranchStart, REFLOG_FORMAT } from '../parsers/reflog'
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

/**
 * Where `ref` left the main line of `mainRef`: the newest commit on `mainRef`'s first-parent
 * history that `ref` contains (the fork point, or the last time `mainRef` was merged into it).
 * Commits `ref` has beyond it are the branch's own, even after the branch was merged into
 * `mainRef` (a merge commit puts the branch on a second parent, not the first-parent line).
 * Null when it can't tell (unknown ref, unrelated histories).
 */
export async function forkPoint(dir: string, ref: string, mainRef: string): Promise<string | null> {
  // Main-line commits `ref` doesn't contain, newest first, each with its parents.
  const output = await gitOrNull(dir, [
    'rev-list',
    '--first-parent',
    '--parents',
    mainRef,
    '--not',
    ref,
    '--'
  ])
  if (output === null) return null
  const oldest = output.trim().split('\n').at(-1)
  // Nothing listed: `ref` already contains all of `mainRef`.
  if (!oldest) {
    const tip = await gitOrNull(dir, ['rev-parse', '--verify', '--quiet', `${mainRef}^{commit}`])
    return tip?.trim() || null
  }
  // The first parent of the oldest commit `ref` lacks is the newest one it has.
  return oldest.split(' ')[1] ?? null
}

/** The commit `branch` was created at, from its reflog; null if the reflog doesn't say. */
export async function branchStart(dir: string, branch: string): Promise<string | null> {
  const output = await gitOrNull(dir, [
    'reflog',
    'show',
    REFLOG_FORMAT,
    `refs/heads/${branch}`,
    '--'
  ])
  return output ? parseBranchStart(output) : null
}
