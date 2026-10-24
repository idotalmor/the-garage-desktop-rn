/** Turns `git pull`'s error output into one plain next step for the user. Pure: no I/O. */

const HINTS: [RegExp, string][] = [
  [
    /local changes to the following files would be overwritten|commit your changes or stash them/i,
    'You have local changes that the pull would overwrite. Commit or stash them, then pull again.'
  ],
  [
    /untracked working tree files would be overwritten/i,
    'Untracked files would be overwritten by the pull. Move or delete them, then pull again.'
  ],
  [
    /divergent branches|need to specify how to reconcile/i,
    'Your branch and the remote both have new commits. Set how to combine them (git config pull.rebase false for merge, true for rebase), or pull from a terminal.'
  ],
  [
    /CONFLICT|Automatic merge failed|could not apply|fix conflicts/i,
    'The pull stopped with conflicts. Resolve them and commit, or undo with git merge --abort (git rebase --abort for a rebase).'
  ],
  [
    /no tracking information|no such ref was fetched/i,
    'This branch has no remote branch to pull from.'
  ],
  [
    /could not resolve host|unable to access|network is unreachable|connection timed out/i,
    'The remote can’t be reached. Check your network connection.'
  ],
  [
    /authentication failed|permission denied|could not read from remote|terminal prompts disabled|could not read username/i,
    'Git couldn’t sign in to the remote. Check your SSH key or credentials (git pull in a terminal will show more).'
  ],
  [
    /you are not currently on a branch/i,
    'This checkout is on a detached HEAD, so there is no branch to pull into.'
  ]
]

/** The hint for a failed pull, or null when the output matches nothing we know. */
export function pullHint(output: string, timedOut: boolean): string | null {
  if (timedOut) return 'The pull took too long and was stopped. Try again, or pull from a terminal.'
  return HINTS.find(([pattern]) => pattern.test(output))?.[1] ?? null
}
