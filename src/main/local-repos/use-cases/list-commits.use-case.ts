/**
 * One page of commit history for a dashboard card. Worktree cards get only their branch's own
 * commits: HEAD minus where it left the default branch's main line (`forkPoint`), so a branch that
 * was already merged still shows its commits; after a fast-forward merge, minus the commit the
 * branch was created at (`branchStart`). Their first page also lists the upstream commits not
 * pulled yet (`incoming`). The branch card gets the default branch's full history. Only reads git
 * for repos and checkouts that are in the DB, so the renderer can't point it at an arbitrary folder.
 */
import type { CommitCursor, CommitPage } from '../../../shared/git/types'
import type {
  CommitHistoryPage,
  IncomingCommits,
  LocalWorktree
} from '../../../shared/local-repos/types'
import {
  branchStart,
  forkPoint,
  listCommits as listGitCommits,
  resolveDefaultBranch
} from '../../git'
import { findRepo } from '../db/tables/local-repos/queries'

/** Commits per page: enough to fill the modal and a bit more, small enough to read instantly. */
const PAGE_SIZE = 50
/** Most commits-to-pull listed at the top; the rest are counted. */
const INCOMING_LIMIT = 100

export async function listCommits(
  repoId: string,
  worktreePath: string | null,
  cursor: CommitCursor | null
): Promise<CommitHistoryPage> {
  const empty: CommitHistoryPage = {
    commits: [],
    next: null,
    baseRef: null,
    total: 0,
    incoming: null
  }
  const repo = findRepo(repoId)
  if (!repo) return empty
  const primary = repo.remotes.find((remote) => remote.name === 'origin') ?? repo.remotes[0]

  if (worktreePath !== null) {
    const tree = repo.worktrees.find((candidate) => candidate.path === worktreePath)
    if (!tree || tree.isPrunable) return empty
    if (cursor) {
      return { ...(await listGitCommits(tree.path, { cursor, limit: PAGE_SIZE })), incoming: null }
    }
    // A checkout of the default branch itself has nothing to subtract: show its whole history.
    const onDefault = tree.branch !== null && tree.branch === repo.defaultBranch
    const { defaultRef } = onDefault
      ? { defaultRef: null }
      : await resolveDefaultBranch(tree.path, primary?.name)
    const [page, incoming] = await Promise.all([
      ownCommits(tree, defaultRef),
      incomingCommits(tree)
    ])
    return { ...page, incoming }
  }

  // Default branch: read from the main checkout if it's on disk, else the shared git dir (bare repos).
  const main = repo.worktrees.find((tree) => tree.isMain && !tree.isPrunable)
  const dir = main?.path ?? repo.commonDir
  if (cursor)
    return { ...(await listGitCommits(dir, { cursor, limit: PAGE_SIZE })), incoming: null }
  const { defaultRef } = await resolveDefaultBranch(dir, primary?.name)
  const page = await listGitCommits(dir, { ref: defaultRef ?? 'HEAD', limit: PAGE_SIZE })
  return { ...page, incoming: null }
}

/** First page of the branch's own commits (see the summary at the top). */
async function ownCommits(tree: LocalWorktree, defaultRef: string | null): Promise<CommitPage> {
  const base = defaultRef ? await forkPoint(tree.path, 'HEAD', defaultRef) : null
  if (!base) return listGitCommits(tree.path, { ref: 'HEAD', limit: PAGE_SIZE })
  const page = await listGitCommits(tree.path, { ref: 'HEAD', exclude: base, limit: PAGE_SIZE })
  if (page.commits.length > 0 || !tree.branch) return { ...page, baseRef: defaultRef }
  // Nothing past the main line: the branch was fast-forwarded into it (or has no commits yet).
  // Its reflog still knows where it was created.
  const start = await branchStart(tree.path, tree.branch)
  if (!start || start === base) return { ...page, baseRef: defaultRef }
  const since = await listGitCommits(tree.path, { ref: 'HEAD', exclude: start, limit: PAGE_SIZE })
  return { ...since, baseRef: defaultRef }
}

/** Upstream commits HEAD doesn't have (`git log HEAD..@{upstream}`), as of the last fetch. */
async function incomingCommits(tree: LocalWorktree): Promise<IncomingCommits | null> {
  if (!tree.upstream) return null
  const page = await listGitCommits(tree.path, {
    ref: '@{upstream}',
    exclude: 'HEAD',
    limit: INCOMING_LIMIT
  })
  const total = page.total ?? page.commits.length
  return total > 0 ? { upstream: tree.upstream, commits: page.commits, total } : null
}
