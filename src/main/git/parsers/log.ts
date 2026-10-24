/** Parses `git log` output. Pure: no I/O. */
import type { CommitSummary } from '../../../shared/git/types'

/** `git log` format matching `parseLogLine`: hash, subject, author, commit time (unix seconds). */
export const LOG_FORMAT = '--format=%H%x00%s%x00%an%x00%ct'

/** Parses one `git log -1 ${LOG_FORMAT}` line. */
export function parseLogLine(output: string): CommitSummary | null {
  const [hash, message, author, committedAt] = output.trim().split('\0')
  if (!hash) return null
  return {
    hash,
    message: message ?? '',
    author: author ?? '',
    committedAt: Number(committedAt) * 1000
  }
}
