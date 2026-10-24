# Git library (`src/main/git`)

Typed access to the git CLI for any main-process feature (local repos today; commit history,
diffs and GitHub matching later). It has no state, no IPC and no feature types: features import
`src/main/git` (the `index.ts` API) and map the results to their own types.

```
run.ts          the only place that spawns git (execFile, no shell, timeout, no prompts/locks)
types.ts        main-only parsed output: GitWorktreeEntry, BranchStatus
parsers/        pure functions: raw git output → typed data (no I/O, easy to unit test)
  worktrees.ts  git worktree list --porcelain
  status.ts     git status --porcelain=v2 --branch -z
  log.ts        git log (LOG_FORMAT)
  remotes.ts    git config remote.*.url
  remote-url.ts remote URL → host/owner/repo/slug (also used to match GitHub repos)
queries/        one file per topic: run git + parse → typed answer
  repository.ts resolveCommonDir, isBareRepository
  worktrees.ts  listWorktrees, pruneWorktrees
  status.ts     readStatus
  log.ts        lastCommit
  remotes.ts    readRemotes
  branches.ts   resolveDefaultBranch
index.ts        public API
```

Types the renderer also sees (`GitRemote`, `CommitSummary`, `GitProvider`) live in
[`src/shared/git/types.ts`](../../shared/git/types.ts).

**Adding a command:** put the parser in `parsers/<topic>.ts`, the function that runs it in
`queries/<topic>.ts`, and export it from `index.ts`.

GitHub data (PRs, CI, reviews) comes from the GitHub API, not from here; this library covers what
is on disk.
