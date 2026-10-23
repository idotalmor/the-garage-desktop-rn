/**
 * Path rules shared by the DB and the watchers.
 *
 * Which scan folders "cover" a repo is not stored: it is worked out from paths. A scan folder
 * covers a repo when the repo's git dir or one of its existing checkouts is inside the folder.
 */
import { sep } from 'path'
import type { LocalWorktree, ScanFolder } from '../../../shared/local-repos/types'

export function isInside(path: string, dir: string): boolean {
  return path === dir || path.startsWith(dir.endsWith(sep) ? dir : dir + sep)
}

export function coveringScanFolderIds(
  repo: { commonDir: string; worktrees: Pick<LocalWorktree, 'path' | 'isPrunable'>[] },
  scanFolders: ScanFolder[]
): string[] {
  const paths = [
    repo.commonDir,
    ...repo.worktrees.filter((tree) => !tree.isPrunable).map((tree) => tree.path)
  ]
  return scanFolders
    .filter((folder) => paths.some((path) => isInside(path, folder.path)))
    .map((folder) => folder.id)
}
