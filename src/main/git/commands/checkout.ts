/** Creates clones or linked checkouts without forcing branches or putting HTTP credentials in argv/config files. */
import { git, gitOrNull } from '../run'
import { listWorktrees } from '../queries/worktrees'

function credentialEnv(httpAuthorization?: string): NodeJS.ProcessEnv {
  if (!httpAuthorization) return {}
  return {
    GIT_CONFIG_COUNT: '3',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `Authorization: ${httpAuthorization}`,
    GIT_CONFIG_KEY_1: 'credential.helper',
    GIT_CONFIG_VALUE_1: '',
    GIT_CONFIG_KEY_2: 'http.followRedirects',
    GIT_CONFIG_VALUE_2: 'false'
  }
}
export async function validateBranch(dir: string, branch: string): Promise<void> {
  await git(dir, ['check-ref-format', '--branch', branch])
  if (branch.startsWith('-') || branch.includes('@{')) throw new Error('Invalid checkout branch.')
}
export async function cloneRepo(
  parent: string,
  url: string,
  destination: string,
  branch: string | null,
  httpAuthorization?: string
): Promise<void> {
  if (branch) await validateBranch(parent, branch)
  await git(
    parent,
    ['clone', ...(branch ? ['--branch', branch] : []), '--', url, destination],
    300_000,
    credentialEnv(httpAuthorization)
  )
}
export async function addWorktree(
  dir: string,
  destination: string,
  branch: string,
  remote = 'origin',
  httpAuthorization?: string
): Promise<void> {
  await validateBranch(dir, branch)
  const occupied = (await listWorktrees(dir)).find((tree) => tree.branch === branch)
  if (occupied)
    throw new Error(
      `This branch already has a checkout at ${occupied.path}. Rescan local repos to update its card.`
    )
  const local = await gitOrNull(dir, [
    'rev-parse',
    '--verify',
    '--quiet',
    `refs/heads/${branch}^{commit}`
  ])
  if (local) {
    await git(dir, ['worktree', 'add', '--', destination, branch], 120_000)
    return
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(remote))
    throw new Error('Unsupported remote name for checkout.')
  const remoteRef = `refs/remotes/${remote}/${branch}`
  if (!(await gitOrNull(dir, ['rev-parse', '--verify', '--quiet', `${remoteRef}^{commit}`]))) {
    await git(
      dir,
      ['fetch', '--no-tags', '--', remote, `refs/heads/${branch}:${remoteRef}`],
      300_000,
      credentialEnv(httpAuthorization)
    )
  }
  await git(
    dir,
    ['worktree', 'add', '--track', '-b', branch, '--', destination, `${remote}/${branch}`],
    120_000
  )
}
