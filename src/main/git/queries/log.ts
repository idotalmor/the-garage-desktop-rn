/** Reads commits. */
import type { CommitCursor, CommitPage, CommitSummary } from '../../../shared/git/types'
import { LOG_FORMAT, parseLog, parseLogLine } from '../parsers/log'
import { gitOrNull } from '../run'

/** Latest commit on `ref` (HEAD by default). Null if there is none. */
export async function lastCommit(dir: string, ref = 'HEAD'): Promise<CommitSummary | null> {
  const output = await gitOrNull(dir, ['log', '-1', LOG_FORMAT, ref, '--'])
  return output ? parseLogLine(output) : null
}

/**
 * One page of commits reachable from `ref`, newest first. With `exclude` (e.g. `origin/main`) it
 * leaves out everything reachable from that ref too (`git log ref ^exclude`): only the branch's
 * own commits. Without a cursor it resolves both refs to SHAs; with one it continues from the
 * cursor's pinned SHAs, skipping what was already returned, so pages stay consistent while new
 * commits land. Empty page when `ref` doesn't resolve; an `exclude` that doesn't resolve is ignored.
 * The first page also carries `total`, the number of commits in the whole range.
 */
export async function listCommits(
  dir: string,
  {
    ref = 'HEAD',
    exclude,
    cursor,
    limit
  }: { ref?: string; exclude?: string | null; cursor?: CommitCursor | null; limit: number }
): Promise<CommitPage> {
  const baseRef = cursor ? null : (exclude ?? null)
  const [head, base] = cursor
    ? [cursor.head, cursor.base]
    : await Promise.all([resolveCommit(dir, ref), exclude ? resolveCommit(dir, exclude) : null])
  if (!head) return { commits: [], next: null, baseRef, total: cursor ? null : 0 }
  const skip = cursor?.skip ?? 0
  const range = [head, ...(base ? [`^${base}`] : []), '--']
  const [output, count] = await Promise.all([
    // Ask for one extra commit to learn whether another page exists.
    gitOrNull(dir, ['log', `--max-count=${limit + 1}`, `--skip=${skip}`, LOG_FORMAT, ...range]),
    // The total only on the first page: later pages share the same pinned range.
    cursor ? null : gitOrNull(dir, ['rev-list', '--count', ...range])
  ])
  const commits = output ? parseLog(output) : []
  const hasMore = commits.length > limit
  return {
    commits: commits.slice(0, limit),
    next: hasMore ? { head, base, skip: skip + limit } : null,
    baseRef: base ? baseRef : null,
    total: count === null ? null : Number(count.trim()) || 0
  }
}

/** Full SHA of the commit `ref` points to, or null if it doesn't resolve (e.g. an empty repo). */
async function resolveCommit(dir: string, ref: string): Promise<string | null> {
  const output = await gitOrNull(dir, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])
  return output?.trim() || null
}
