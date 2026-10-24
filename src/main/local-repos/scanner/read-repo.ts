/**
 * Step 2 of a scan: read one repo from git into a `ScannedRepo` with all its checkouts. This is
 * where linked worktrees outside the source are found (`git worktree list`).
 *
 * Asks git for the repo's checkouts, remotes and default branch, then reads branch/status/last
 * commit of each checkout. `rereadRepo` re-runs this for one stored repo after a change.
 */
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { basename, dirname } from 'path'
import type { LocalWorktree, ScannedRepo } from '../../../shared/local-repos/types'
import {
  isBareRepository,
  lastCommit,
  listWorktrees,
  providerForHost,
  readRemotes,
  readStatus,
  resolveDefaultBranch,
  type GitWorktreeEntry
} from '../../git'
import { GIT_CONCURRENCY, mapLimit } from './concurrency'
import type { RepoFolder } from './find-repo-folders'

export async function readRepo(commonDir: string, folder: RepoFolder): Promise<ScannedRepo> {
  const [listed, remotes, isBare] = await Promise.all([
    listWorktrees(folder.dir),
    readRemotes(folder.dir),
    isBareRepository(commonDir)
  ])
  const primary = remotes.find((remote) => remote.name === 'origin') ?? remotes[0] ?? null

  const worktrees = (
    await mapLimit(listed, GIT_CONCURRENCY, async (entry, index) => {
      if (entry.isBare) return null
      return readWorktree(entry, index === 0 && !isBare)
    })
  ).filter((tree): tree is LocalWorktree => tree !== null)

  const { defaultBranch, defaultRef } = await resolveDefaultBranch(folder.dir, primary?.name)
  const defaultBranchCommit = defaultRef ? await lastCommit(folder.dir, defaultRef) : null

  return {
    id: createHash('sha1').update(commonDir).digest('hex').slice(0, 16),
    name: primary?.repo ?? repoNameFromPaths(commonDir, worktrees),
    commonDir,
    isBare,
    provider: providerForHost(primary?.host ?? null),
    fullName: primary?.owner && primary.repo ? `${primary.owner}/${primary.repo}` : null,
    slug: primary?.slug ?? null,
    remoteUrl: primary?.url ?? null,
    remotes,
    defaultBranch,
    defaultBranchCommit,
    worktrees,
    scannedAt: Date.now(),
    updatedAt: Math.max(0, ...worktrees.map((tree) => tree.lastCommit?.committedAt ?? 0))
  }
}

/** Re-reads a repo that is already stored (after a file change). Returns null if it is gone. */
export async function rereadRepo(repo: ScannedRepo): Promise<ScannedRepo | null> {
  const exists = await fs.access(repo.commonDir).then(
    () => true,
    () => false
  )
  if (!exists) return null
  const main = repo.worktrees.find((tree) => tree.isMain && !tree.isPrunable)
  const dir = main && (await fs.stat(main.path).catch(() => null))?.isDirectory()
  return readRepo(repo.commonDir, {
    dir: dir && main ? main.path : repo.commonDir,
    kind: repo.isBare ? 'bare' : 'worktree'
  })
}

async function readWorktree(entry: GitWorktreeEntry, isMain: boolean): Promise<LocalWorktree> {
  const base: LocalWorktree = {
    path: entry.path,
    name: basename(entry.path),
    isMain,
    branch: entry.branch,
    isDetached: entry.isDetached,
    head: entry.head,
    isLocked: entry.isLocked,
    isPrunable: entry.isPrunable,
    upstream: null,
    ahead: null,
    behind: null,
    changedFiles: 0,
    lastCommit: null
  }
  if (entry.isPrunable) return base

  const [status, commit] = await Promise.all([readStatus(entry.path), lastCommit(entry.path)])
  if (!status) return { ...base, lastCommit: commit }
  return {
    ...base,
    branch: status.branch ?? base.branch,
    head: status.head ?? base.head,
    upstream: status.upstream,
    ahead: status.ahead,
    behind: status.behind,
    changedFiles: status.changedFiles,
    lastCommit: commit
  }
}

/** Fallback name for repos without a remote: the main checkout's folder, else the repo folder. */
function repoNameFromPaths(commonDir: string, worktrees: LocalWorktree[]): string {
  const main = worktrees.find((tree) => tree.isMain)
  if (main) return main.name
  const name = basename(commonDir)
  return name === '.git' ? basename(dirname(commonDir)) : name.replace(/\.git$/, '')
}
