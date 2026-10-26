/** Creates a confirmed checkout without overwrites, then registers/refreshes it through local repos. */
import type { CheckoutRequest } from '../../../shared/git-sources/types'
import { addWorktree, cloneRepo, listWorktrees } from '../../git'
import { getSnapshot as localSnapshot } from '../../local-repos/sync'
import { addSources, rescan } from '../../local-repos/use-cases'
import { findRepo, listRepos } from '../db/tables/repos/queries'
import { getToken } from '../credentials'
import { listSources } from '../db/tables/git-sources/queries'
import { reserveCheckoutFolder, parseCloneUrl } from '../checkout'
import { prepareCheckout } from './prepare-checkout.use-case'

export async function createCheckout(request: CheckoutRequest, parent: string): Promise<string> {
  const plan = await prepareCheckout(request)
  const local = localSnapshot().repos
  const repo = plan.localRepoId ? local.find((repo) => repo.id === plan.localRepoId) : null
  const pasted = request.repo.kind === 'url' ? parseCloneUrl(request.repo.url) : null
  const remote =
    request.repo.kind === 'remote'
      ? findRepo(request.repo.sourceId, request.repo.externalId)
      : listRepos().find(
          (remote) =>
            `${remote.host}/${remote.fullName}`.toLowerCase() ===
            (pasted?.slug ?? repo?.slug?.toLowerCase())
        )
  const cloneUrl = pasted?.cloneUrl ?? remote?.cloneUrl
  if (!repo && !cloneUrl) throw new Error('No clone URL is available for this repo.')
  if (cloneUrl && !pasted) {
    const url = new URL(cloneUrl)
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'github.com' ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname.toLowerCase() !== `/${remote!.fullName}.git`.toLowerCase()
    )
      throw new Error('Invalid GitHub clone URL.')
  }
  if (pasted && repo) {
    const existing = (await listWorktrees(repo.commonDir)).find(
      (tree) => !tree.isPrunable && tree.branch === plan.branch
    )
    if (existing) {
      await rescan()
      return existing.path
    }
  }
  const accounts = pasted && !remote ? listSources() : []
  const sourceId = remote?.sourceId ?? (accounts.length === 1 ? accounts[0].id : undefined)
  const token =
    sourceId && (!pasted || cloneUrl?.startsWith('https://')) ? getToken(sourceId) : undefined
  const authorization = token
    ? `Basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`
    : undefined
  const destination = await reserveCheckoutFolder(parent, plan.folderName, local)
  try {
    if (repo && plan.branch) {
      const primary = repo.remotes.find((remote) => remote.name === 'origin') ?? repo.remotes[0]
      await addWorktree(
        repo.commonDir,
        destination,
        plan.branch,
        primary?.name ?? 'origin',
        authorization
      )
      await rescan()
    } else {
      await cloneRepo(
        parent,
        cloneUrl!,
        destination,
        plan.branch === remote?.defaultBranch ? null : plan.branch,
        authorization
      )
      await addSources([destination])
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      authorization &&
      (message.includes(authorization) ||
        message.includes(authorization.slice(6)) ||
        (token && message.includes(token)))
    )
      throw new Error(
        `Checkout failed. Check GitHub access and inspect ${destination} before retrying.`
      )
    throw new Error(
      `${message}\nCheckout folder: ${destination}. Any partial checkout is kept; existing files are never deleted.`
    )
  }
  return destination
}
