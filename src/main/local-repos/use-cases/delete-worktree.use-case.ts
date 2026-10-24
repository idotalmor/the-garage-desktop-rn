/**
 * Deletes a checkout: its folder goes to the Trash (recoverable), stale worktree metadata is
 * pruned from the shared git dir, and the repo is re-read on the job queue so its cards update.
 * Deleting the remote branch is a no-op until GitHub integration lands.
 */
import { shell } from 'electron'
import type { LocalReposSnapshot } from '../../../shared/local-repos/types'
import { pruneWorktrees } from '../../git'
import { listRepos } from '../db/tables/local-repos/queries'
import { enqueue, getSnapshot } from '../sync'
import { refreshRepos } from './refresh-repos.use-case'

export async function deleteWorktree(
  path: string,
  deleteRemote: boolean
): Promise<LocalReposSnapshot> {
  const repo = listRepos().find((repo) => repo.worktrees.some((tree) => tree.path === path))
  await shell.trashItem(path)
  if (deleteRemote) removeRemoteBranch(repo?.worktrees.find((tree) => tree.path === path)?.branch)
  if (!repo) return getSnapshot()
  // Fails when the shared git dir was inside the trashed folder; refreshRepos then drops the repo.
  await pruneWorktrees(repo.commonDir).catch(() => '')
  await enqueue(() => refreshRepos([repo.id]), false)
  return getSnapshot()
}

/** Will delete the checkout's remote branch once GitHub integration exists. */
function removeRemoteBranch(branch: string | null | undefined): void {
  console.warn('[local-repos] remote branch deletion is not implemented yet', branch)
}
