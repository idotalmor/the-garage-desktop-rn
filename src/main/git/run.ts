/**
 * Runs git commands. This is the only place that spawns a git process.
 *
 * - Uses `execFile` (no shell), so paths and arguments are never interpreted by a shell.
 * - `GIT_OPTIONAL_LOCKS=0` keeps read-only commands like `git status` from taking the index lock,
 *   so a background scan never blocks the user's own git commands.
 * - `GIT_TERMINAL_PROMPT=0` makes git fail instead of hanging on a credentials prompt.
 */
import { execFile } from 'child_process'
import { existsSync } from 'fs'

const GIT_CANDIDATES = ['/opt/homebrew/bin/git', '/usr/local/bin/git', '/usr/bin/git']

// Apps launched from Finder don't inherit the login-shell PATH, so resolve git explicitly.
const gitBinary = GIT_CANDIDATES.find((candidate) => existsSync(candidate)) ?? 'git'

const GIT_ENV = {
  ...process.env,
  GIT_OPTIONAL_LOCKS: '0',
  GIT_TERMINAL_PROMPT: '0',
  LC_ALL: 'C'
}

export class GitError extends Error {
  constructor(
    message: string,
    readonly exitCode: number | null
  ) {
    super(message)
  }
}

/** Runs `git -C <cwd> <args>` and resolves with stdout. Rejects with `GitError` on failure. */
export function git(
  cwd: string,
  args: string[],
  timeoutMs = 15_000,
  env: NodeJS.ProcessEnv = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      gitBinary,
      ['-C', cwd, ...args],
      {
        env: { ...GIT_ENV, ...env },
        timeout: timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true
      },
      (error, stdout, stderr) => {
        if (error) {
          const code = typeof error.code === 'number' ? error.code : null
          reject(new GitError(String(stderr || error.message).trim(), code))
          return
        }
        resolve(stdout)
      }
    )
  })
}

/** Same as `git()`, but resolves with null instead of throwing. */
export async function gitOrNull(cwd: string, args: string[]): Promise<string | null> {
  try {
    return await git(cwd, args)
  } catch {
    return null
  }
}
