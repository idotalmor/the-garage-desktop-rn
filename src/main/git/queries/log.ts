/** Reads commits. */
import type { CommitSummary } from '../../../shared/git/types'
import { LOG_FORMAT, parseLogLine } from '../parsers/log'
import { gitOrNull } from '../run'

/** Latest commit on `ref` (HEAD by default). Null if there is none. */
export async function lastCommit(dir: string, ref = 'HEAD'): Promise<CommitSummary | null> {
  const output = await gitOrNull(dir, ['log', '-1', LOG_FORMAT, ref, '--'])
  return output ? parseLogLine(output) : null
}
