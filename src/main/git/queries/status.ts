/** Reads the branch and working-tree state of one checkout. */
import { parseStatusV2 } from '../parsers/status'
import { gitOrNull } from '../run'
import type { BranchStatus } from '../types'

/** Branch, upstream, ahead/behind and changed-file count of one checkout. Null if git fails. */
export async function readStatus(dir: string): Promise<BranchStatus | null> {
  const output = await gitOrNull(dir, ['status', '--porcelain=v2', '--branch', '-z'])
  return output ? parseStatusV2(output) : null
}
