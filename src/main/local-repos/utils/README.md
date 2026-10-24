# Utils (`utils/`)

- `coverage.ts`: which sources cover a repo, worked out from paths (never stored).
  `isInside(path, dir)` (also used by `watcher/watch-targets.ts`), `coveringSourceIds(repo, sources)`
  (the repo's git dir or a non-prunable checkout is inside the source), `uncoveredRepoIds(repos, sources)`
  (used by `remove-source`, `scan-sources` and `refresh-repos` to delete repos nothing covers).
- `pull-hints.ts`: `pullHint(output, timedOut)` maps `git pull`'s error output (local changes,
  untracked files, divergent branches, conflicts, auth, network, detached HEAD) to one plain next
  step, used by `pull-worktree`. Null when nothing matches; the UI then shows git's output alone.
