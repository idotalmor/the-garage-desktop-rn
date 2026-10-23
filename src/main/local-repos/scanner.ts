import { createHash } from 'crypto'
import { promises as fs, type Dirent } from 'fs'
import { basename, dirname, join, resolve } from 'path'
import type {
  GitRemote,
  LocalRepository,
  LocalWorktree,
  ScanProgress
} from '../../shared/local-repos/types'
import { git, gitOrNull, lastCommit, parseStatusV2, parseWorktreeList } from './git'
import { parseRemoteUrl, providerForHost } from './remote-url'

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'out',
  'build',
  'target',
  'vendor',
  'Pods',
  'DerivedData',
  'Library',
  'Applications',
  '__pycache__',
  'venv'
])
const ALLOWED_HIDDEN_DIRS = new Set(['.worktrees', '.claude', '.devin', '.cursor'])

const GIT_CONCURRENCY = 6

type Candidate = { dir: string; kind: 'worktree' | 'bare' }

export type ScanResult = {
  repositories: LocalRepository[]
  dirsVisited: number
}

export async function scanFolder(
  scanFolderPath: string,
  scanFolderId: string,
  maxDepth: number,
  onProgress?: (progress: ScanProgress) => void
): Promise<ScanResult> {
  const progress: ScanProgress = { scanFolderPath, dirsVisited: 0, reposFound: 0 }
  const candidates = await discover(scanFolderPath, maxDepth, progress, onProgress)

  const byCommonDir = new Map<string, Candidate>()
  await mapLimit(candidates, GIT_CONCURRENCY, async (candidate) => {
    const commonDir = await resolveCommonDir(candidate.dir)
    if (commonDir && !byCommonDir.has(commonDir)) byCommonDir.set(commonDir, candidate)
  })

  const repositories = (
    await mapLimit([...byCommonDir.entries()], GIT_CONCURRENCY, ([commonDir, candidate]) =>
      inspectRepository(commonDir, candidate, scanFolderId).catch(() => null)
    )
  ).filter((repo): repo is LocalRepository => repo !== null)

  progress.reposFound = repositories.length
  onProgress?.({ ...progress })
  return { repositories, dirsVisited: progress.dirsVisited }
}

async function discover(
  scanFolderPath: string,
  maxDepth: number,
  progress: ScanProgress,
  onProgress?: (progress: ScanProgress) => void
): Promise<Candidate[]> {
  const candidates: Candidate[] = []
  const seen = new Set<string>()
  let queue: { dir: string; depth: number }[] = [{ dir: scanFolderPath, depth: 0 }]

  while (queue.length > 0) {
    const next: { dir: string; depth: number }[] = []
    await mapLimit(queue, 16, async ({ dir, depth }) => {
      let real: string
      try {
        real = await fs.realpath(dir)
      } catch {
        return
      }
      if (seen.has(real)) return
      seen.add(real)
      progress.dirsVisited++

      let entries: Dirent[]
      try {
        entries = await fs.readdir(dir, { withFileTypes: true })
      } catch {
        return
      }

      const candidate = await classify(dir, entries)
      if (candidate) {
        candidates.push(candidate)
        progress.reposFound = candidates.length
        return // sibling worktrees are found through `git worktree list`
      }
      if (depth >= maxDepth) return

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue
        if (SKIP_DIRS.has(entry.name)) continue
        if (entry.name.startsWith('.') && !ALLOWED_HIDDEN_DIRS.has(entry.name)) continue
        next.push({ dir: join(dir, entry.name), depth: depth + 1 })
      }
    })
    onProgress?.({ ...progress })
    queue = next
  }
  return candidates
}

async function classify(dir: string, entries: Dirent[]): Promise<Candidate | null> {
  const dotGit = entries.find((entry) => entry.name === '.git')
  if (dotGit?.isDirectory()) return { dir, kind: 'worktree' }
  if (dotGit?.isFile()) {
    const content = await fs.readFile(join(dir, '.git'), 'utf-8').catch(() => '')
    const gitdir = /^gitdir:\s*(.+)$/m.exec(content)?.[1]?.trim()
    if (!gitdir || /[\\/]modules[\\/]/.test(gitdir)) return null // submodule
    return { dir, kind: 'worktree' }
  }

  const names = new Set(entries.map((entry) => entry.name))
  if (names.has('HEAD') && names.has('objects') && names.has('refs')) {
    const isBare = (await gitOrNull(dir, ['rev-parse', '--is-bare-repository']))?.trim()
    if (isBare === 'true') return { dir, kind: 'bare' }
  }
  return null
}

async function resolveCommonDir(dir: string): Promise<string | null> {
  const output = await gitOrNull(dir, ['rev-parse', '--git-common-dir'])
  if (!output) return null
  try {
    return await fs.realpath(resolve(dir, output.trim()))
  } catch {
    return null
  }
}

async function inspectRepository(
  commonDir: string,
  candidate: Candidate,
  scanFolderId: string
): Promise<LocalRepository> {
  const [worktreeOutput, remotes, isBareOutput] = await Promise.all([
    git(candidate.dir, ['worktree', 'list', '--porcelain']),
    readRemotes(candidate.dir),
    gitOrNull(commonDir, ['rev-parse', '--is-bare-repository'])
  ])
  const isBare = isBareOutput?.trim() === 'true'
  const primary = remotes.find((remote) => remote.name === 'origin') ?? remotes[0] ?? null

  const listed = parseWorktreeList(worktreeOutput)
  const worktrees = (
    await mapLimit(listed, GIT_CONCURRENCY, async (entry, index) => {
      if (entry.isBare) return null
      return inspectWorktree(entry, index === 0 && !isBare)
    })
  ).filter((tree): tree is LocalWorktree => tree !== null)

  const { defaultBranch, defaultRef } = await resolveDefaultBranch(candidate.dir, primary?.name)
  const defaultBranchCommit = defaultRef ? await lastCommit(candidate.dir, defaultRef) : null

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
    scanFolderIds: [scanFolderId],
    worktrees,
    scannedAt: Date.now()
  }
}

async function inspectWorktree(
  entry: ReturnType<typeof parseWorktreeList>[number],
  isMain: boolean
): Promise<LocalWorktree> {
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

  const [statusOutput, commit] = await Promise.all([
    gitOrNull(entry.path, ['status', '--porcelain=v2', '--branch', '-z']),
    lastCommit(entry.path)
  ])
  if (!statusOutput) return { ...base, lastCommit: commit }
  const status = parseStatusV2(statusOutput)
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

async function readRemotes(cwd: string): Promise<GitRemote[]> {
  const output = await gitOrNull(cwd, ['config', '--get-regexp', '^remote\\..*\\.url$'])
  if (!output) return []
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(' ')
      const name = key.replace(/^remote\./, '').replace(/\.url$/, '')
      const url = rest.join(' ')
      return { name, url, ...parseRemoteUrl(url) }
    })
}

async function resolveDefaultBranch(
  cwd: string,
  remote: string | undefined
): Promise<{ defaultBranch: string | null; defaultRef: string | null }> {
  if (remote) {
    const symbolic = await gitOrNull(cwd, [
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
      const exists = await gitOrNull(cwd, ['rev-parse', '--verify', '--quiet', ref])
      if (exists) return { defaultBranch: branch, defaultRef: ref }
    }
  }
  return { defaultBranch: null, defaultRef: null }
}

function repoNameFromPaths(commonDir: string, worktrees: LocalWorktree[]): string {
  const main = worktrees.find((tree) => tree.isMain)
  if (main) return main.name
  const name = basename(commonDir)
  return name === '.git' ? basename(dirname(commonDir)) : name.replace(/\.git$/, '')
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}
