/** Parses `git reflog` output. Pure: no I/O. */

/** `git reflog` format matching `parseBranchStart`: new SHA, then the entry's message. */
export const REFLOG_FORMAT = '--format=%H%x00%gs'

/**
 * The commit a branch was created at, from its reflog (oldest entry last): only when that entry
 * says `branch: Created from …`. Null when the reflog doesn't go back that far.
 */
export function parseBranchStart(output: string): string | null {
  const oldest = output.trim().split('\n').at(-1)
  if (!oldest) return null
  const [hash, message] = oldest.split('\0')
  return hash && message?.startsWith('branch: Created from') ? hash : null
}
