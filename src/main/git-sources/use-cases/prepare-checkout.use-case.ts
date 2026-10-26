/** Resolves cached/local repo identity and plans a first clone or sibling linked worktree. */
import type { CheckoutPlan, CheckoutRequest } from '../../../shared/git-sources/types'
import { getSnapshot as localSnapshot } from '../../local-repos/sync'
import { validateBranch } from '../../git'
import { findRepo } from '../db/tables/repos/queries'
import { checkoutFolderName, suggestedCheckoutParent, parseCloneUrl } from '../checkout'

export async function prepareCheckout(request: CheckoutRequest): Promise<CheckoutPlan> {
  const local = localSnapshot().repos
  const target = request.repo
  const remote = target.kind === 'remote' ? findRepo(target.sourceId, target.externalId) : null
  if (request.repo.kind === 'remote' && !remote)
    throw new Error('Git source repo is no longer available. Refresh the connection.')
  const pasted = target.kind === 'url' ? parseCloneUrl(target.url) : null
  const identity =
    pasted?.slug ?? (remote ? `${remote.host}/${remote.fullName}`.toLowerCase() : null)
  const repo =
    target.kind === 'local'
      ? local.find((repo) => repo.id === target.id)
      : local.find((repo) => repo.slug?.toLowerCase() === identity)
  if (request.repo.kind === 'local' && !repo)
    throw new Error('Local repo is no longer available. Rescan your folders.')
  const branch = request.branch ?? repo?.defaultBranch ?? remote?.defaultBranch ?? null
  if (repo && !branch) throw new Error('This repo has no known branch to check out.')
  if (branch) {
    if (branch.length > 250) throw new Error('Invalid checkout branch.')
    await validateBranch(repo?.commonDir ?? process.cwd(), branch)
  }
  return {
    mode: repo ? 'worktree' : 'clone',
    localRepoId: repo?.id ?? null,
    folderName: checkoutFolderName(repo?.name ?? pasted?.name ?? remote!.name, branch, !!repo),
    suggestedParent: repo ? await suggestedCheckoutParent(repo, local) : null,
    branch
  }
}
