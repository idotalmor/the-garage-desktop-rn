/**
 * Step 1 of a scan: walk a source and find every place that looks like a git repo.
 *
 * A directory is a candidate when it has a `.git` folder (normal repo), a `.git` file (linked
 * worktree), or is itself a bare repo. The walk stops descending at a candidate; other checkouts
 * of the same repo are found later through `git worktree list`.
 */
import { promises as fs, type Dirent } from 'fs'
import { join } from 'path'
import type { ScanProgress } from '../../../shared/local-repos/types'
import { isBareRepository } from '../../git'
import { mapLimit } from '../utils/concurrency'

/** Folders that never contain repos worth showing, or are too large to walk. */
export const SKIP_DIRS = new Set([
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
/** Hidden folders are skipped, except these common worktree locations. */
export const ALLOWED_HIDDEN_DIRS = new Set(['.worktrees', '.claude', '.devin', '.cursor'])

const FS_CONCURRENCY = 16

/** A directory that looks like a checkout (`worktree`) or a bare repo. */
export type Candidate = { dir: string; kind: 'worktree' | 'bare' }

/** Breadth-first walk of `sourcePath` up to `maxDepth` levels, reporting progress per level. */
export async function discover(
  sourcePath: string,
  maxDepth: number,
  progress: ScanProgress,
  onProgress?: (progress: ScanProgress) => void
): Promise<Candidate[]> {
  const candidates: Candidate[] = []
  const seen = new Set<string>()
  let queue: { dir: string; depth: number }[] = [{ dir: sourcePath, depth: 0 }]

  while (queue.length > 0) {
    const next: { dir: string; depth: number }[] = []
    await mapLimit(queue, FS_CONCURRENCY, async ({ dir, depth }) => {
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
        return
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

/** Decides whether `dir` is a checkout, a bare repo, or neither. Submodules are ignored. */
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
    if (await isBareRepository(dir)) return { dir, kind: 'bare' }
  }
  return null
}
