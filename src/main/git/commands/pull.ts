/**
 * `git pull` in a checkout: the one git command here that talks to the network and changes the
 * working tree. Uses the user's own pull config (merge or rebase). `--no-edit` keeps a merge from
 * waiting for an editor nobody can see. Rejects with `GitError` (git's stderr) when git refuses.
 */
import { git } from '../run'

/** Long enough for a slow fetch; a hung SSH/HTTPS connection still fails instead of spinning forever. */
const PULL_TIMEOUT_MS = 120_000

export function pull(dir: string): Promise<string> {
  return git(dir, ['pull', '--no-edit'], PULL_TIMEOUT_MS)
}
