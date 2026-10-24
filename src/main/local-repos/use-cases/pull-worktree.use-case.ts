/**
 * Pulls a checkout's remote branch (the ↓N chip on a card). Only for checkouts in the DB. On
 * failure it returns git's output plus a plain next step instead of throwing, so the UI can show
 * it as is. Either way the repo is re-read on the job queue so ahead/behind and commits update.
 */
import type { PullResult } from '../../../shared/local-repos/types'
import { GitError, pull } from '../../git'
import { listRepos } from '../db/tables/local-repos/queries'
import { enqueue } from '../sync'
import { pullHint } from '../utils/pull-hints'
import { refreshRepos } from './refresh-repos.use-case'

export async function pullWorktree(path: string): Promise<PullResult> {
  const repo = listRepos().find((repo) => repo.worktrees.some((tree) => tree.path === path))
  const tree = repo?.worktrees.find((candidate) => candidate.path === path)
  if (!repo || !tree || tree.isPrunable) {
    return { ok: false, message: 'This checkout is no longer on disk.', hint: null }
  }
  try {
    await pull(tree.path)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const timedOut = error instanceof GitError && error.exitCode === null
    return { ok: false, message, hint: pullHint(message, timedOut) }
  } finally {
    void enqueue(() => refreshRepos([repo.id]), false)
  }
}
