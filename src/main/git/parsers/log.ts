/** Parses `git log` output. Pure: no I/O. */
import type { CommitSummary } from '../../../shared/git/types'

/**
 * `git log` format matching `parseLogLine` / `parseLog`: hash, subject, author, commit time (unix
 * seconds), separated by NUL; each commit ends with a record separator (0x1e) so `parseLog` can
 * split many commits without depending on newlines.
 */
/** Ends each commit in `LOG_FORMAT` (`%x1e`, ASCII record separator). */
const RECORD_END = '\x1e'

export const LOG_FORMAT = '--format=%H%x00%s%x00%an%x00%ct%x1e'

/** Parses one commit in `LOG_FORMAT` (e.g. the output of `git log -1`). */
export function parseLogLine(output: string): CommitSummary | null {
  const [hash, message, author, committedAt] = output.replaceAll(RECORD_END, '').trim().split('\0')
  if (!hash) return null
  return {
    hash,
    message: message ?? '',
    author: author ?? '',
    committedAt: Number(committedAt) * 1000
  }
}

/** Parses many commits in `LOG_FORMAT`, newest first (git's order). */
export function parseLog(output: string): CommitSummary[] {
  return output
    .split(RECORD_END)
    .map(parseLogLine)
    .filter((commit): commit is CommitSummary => commit !== null)
}
