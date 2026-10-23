/**
 * Questions the scanner asks git about a folder. Each function runs git (run.ts) and turns the
 * output into typed data (parsers.ts). Functions return null/empty instead of throwing when git
 * can't answer, except `listWorktrees`, which the scanner needs to succeed.
 */
import { promises as fs } from 'fs'
import { resolve } from 'path'
import type { CommitSummary, GitRemote } from '../../../shared/local-repos/types'
import { parseRemoteUrl } from '../utils/remote-url'
import {
  LOG_FORMAT,
  parseLogLine,
  parseRemoteConfig,
  parseStatusV2,
  parseWorktreeList,
  type BranchStatus,
  type PorcelainWorktree
} from './parsers'
import { git, gitOrNull } from './run'

/** The shared `.git` directory of a checkout. All checkouts of one repo return the same path. */
export async function resolveCommonDir(dir: string): Promise<string | null> {
  const output = await gitOrNull(dir, ['rev-parse', '--git-common-dir'])
  if (!output) return null
  try {
    return await fs.realpath(resolve(dir, output.trim()))
  } catch {
    return null
  }
}

/** True for a repo with no checked-out files (e.g. `git clone --bare`). */
export async function isBareRepository(dir: string): Promise<boolean> {
  return (await gitOrNull(dir, ['rev-parse', '--is-bare-repository']))?.trim() === 'true'
}

/** Every checkout of the repo `dir` belongs to, main checkout first. */
export async function listWorktrees(dir: string): Promise<PorcelainWorktree[]> {
  return parseWorktreeList(await git(dir, ['worktree', 'list', '--porcelain']))
}

/** Branch, upstream, ahead/behind and changed-file count of one checkout. */
export async function readStatus(dir: string): Promise<BranchStatus | null> {
  const output = await gitOrNull(dir, ['status', '--porcelain=v2', '--branch', '-z'])
  return output ? parseStatusV2(output) : null
}

/** Latest commit on `ref` (HEAD by default). */
export async function lastCommit(dir: string, ref = 'HEAD'): Promise<CommitSummary | null> {
  const output = await gitOrNull(dir, ['log', '-1', LOG_FORMAT, ref, '--'])
  return output ? parseLogLine(output) : null
}

/** All configured remotes, with their URLs normalized to host/owner/repo. */
export async function readRemotes(dir: string): Promise<GitRemote[]> {
  const output = await gitOrNull(dir, ['config', '--get-regexp', '^remote\\..*\\.url$'])
  if (!output) return []
  return parseRemoteConfig(output).map(({ name, url }) => ({ name, url, ...parseRemoteUrl(url) }))
}

/**
 * The repo's default branch: what `<remote>/HEAD` points to, else the first of
 * main/master/develop/trunk that exists. `defaultRef` is the ref to read its last commit from.
 */
export async function resolveDefaultBranch(
  dir: string,
  remote: string | undefined
): Promise<{ defaultBranch: string | null; defaultRef: string | null }> {
  if (remote) {
    const symbolic = await gitOrNull(dir, [
      'symbolic-ref',
      '--quiet',
      '--short',
      `refs/remotes/${remote}/HEAD`
    ])
    const ref = symbolic?.trim()
    if (ref) return { defaultBranch: ref.slice(remote.length + 1), defaultRef: ref }
  }
  for (const branch of ['main', 'master', 'develop', 'trunk']) {
    const candidates = remote ? [`refs/remotes/${remote}/${branch}`] : []
    candidates.push(`refs/heads/${branch}`)
    for (const ref of candidates) {
      const exists = await gitOrNull(dir, ['rev-parse', '--verify', '--quiet', ref])
      if (exists) return { defaultBranch: branch, defaultRef: ref }
    }
  }
  return { defaultBranch: null, defaultRef: null }
}
