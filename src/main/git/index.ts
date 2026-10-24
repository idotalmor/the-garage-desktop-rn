/**
 * Git library for the main process: typed questions to the git CLI. Features import from here,
 * never from `run.ts`, `parsers/` or `queries/` directly. Queries return null/empty instead of
 * throwing when git can't answer, except `listWorktrees`.
 */
export { GitError } from './run'
export type { BranchStatus, GitWorktreeEntry } from './types'
export type { CommitSummary, GitProvider, GitRemote } from '../../shared/git/types'
export { parseRemoteUrl, providerForHost } from './parsers/remote-url'
export { resolveDefaultBranch } from './queries/branches'
export { lastCommit } from './queries/log'
export { readRemotes } from './queries/remotes'
export { isBareRepository, resolveCommonDir } from './queries/repository'
export { readStatus } from './queries/status'
export { listWorktrees, pruneWorktrees } from './queries/worktrees'
