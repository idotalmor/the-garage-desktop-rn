/** Safe checkout placement: siblings of existing checkouts, never nested inside a checkout or git directory. */
import { promises as fs } from 'fs'
import { dirname, isAbsolute, join, relative, sep } from 'path'
import type { LocalRepo } from '../../../shared/local-repos/types'
import { resolveCommonDir } from '../../git'
export { parseCloneUrl } from './url'

function contains(parent: string, child: string): boolean {
  const path = relative(parent, child)
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))
}
export function checkoutFolderName(name: string, branch: string | null, linked: boolean): string {
  const label = linked ? `${name}-${branch ?? 'worktree'}` : name
  const safe = label
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 100)
    .replace(/[.-]+$/g, '')
  if (!safe || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe))
    throw new Error('Repo/branch cannot be used as a checkout folder name.')
  return safe
}
export async function suggestedCheckoutParent(
  repo: LocalRepo,
  allRepos: LocalRepo[]
): Promise<string | null> {
  const trees = [...repo.worktrees].sort((a, b) => Number(b.isMain) - Number(a.isMain))
  let checkout: string | null = null
  for (const tree of trees) {
    if (!tree.isPrunable) checkout = await fs.realpath(tree.path).catch(() => null)
    if (checkout) break
  }
  if (!checkout && repo.isBare) checkout = await fs.realpath(repo.commonDir).catch(() => null)
  if (!checkout) return null
  let parent = dirname(checkout)
  while (true) {
    try {
      return await validateCheckoutParent(parent, allRepos)
    } catch {
      const next = dirname(parent)
      if (next === parent) return null
      parent = next
    }
  }
}
export async function validateCheckoutParent(parent: string, repos: LocalRepo[]): Promise<string> {
  if (!isAbsolute(parent)) throw new Error('Choose an absolute parent folder for the checkout.')
  const canonical = await fs.realpath(parent)
  if (!(await fs.stat(canonical)).isDirectory())
    throw new Error('The checkout parent must be a folder.')
  for (const repo of repos) {
    const roots = [repo.commonDir, ...repo.worktrees.map((tree) => tree.path)]
    for (const root of roots) {
      const actual = await fs.realpath(root).catch(() => root)
      if (contains(actual, canonical))
        throw new Error(
          'Choose a parent outside existing repos/worktrees. The checkout must be a sibling, not a nested folder.'
        )
    }
  }
  if (await resolveCommonDir(canonical))
    throw new Error(
      'This folder is inside a Git repo. Choose its parent instead so the repo stays clean.'
    )
  return canonical
}
export async function reserveCheckoutFolder(
  parent: string,
  name: string,
  repos: LocalRepo[]
): Promise<string> {
  if (!name || name === '.' || name === '..' || name.includes('/') || name.includes('\\'))
    throw new Error('Invalid checkout folder name.')
  const canonical = await validateCheckoutParent(parent, repos)
  const destination = join(canonical, name)
  try {
    await fs.mkdir(destination)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new Error(
        `The checkout folder already exists: ${destination}. Choose another parent; existing folders are never overwritten.`
      )
    throw error
  }
  return destination
}
