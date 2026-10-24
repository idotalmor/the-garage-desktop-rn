/** Git types the renderer also sees (through feature types like `LocalRepo`). */

/** Where a repo's remote is hosted: GitHub, another host (GitLab, Bitbucket…), or no remote at all. */
export type GitProvider = 'github' | 'other' | 'none'

/** One entry from `git remote -v`. */
export type GitRemote = {
  /** Remote name, e.g. `origin` or `upstream`. */
  name: string
  /** Raw URL as configured, e.g. `git@github.com:owner/repo.git`. */
  url: string
  /** Normalized host, e.g. `github.com` (SSH aliases like `github.com-work` become `github.com`). */
  host: string | null
  /** Account or organization that owns the repo. */
  owner: string | null
  /** Repo name without `.git`. */
  repo: string | null
  /** Canonical, lower-cased `host/owner/repo`. The key used to match the GitHub repo later. */
  slug: string | null
}

/** The few commit fields the UI shows. */
export type CommitSummary = {
  /** Full commit SHA. */
  hash: string
  /** First line of the commit message. */
  message: string
  /** Author name. */
  author: string
  /** Commit time (epoch ms). */
  committedAt: number
}

/**
 * Where the next page of a commit list starts. `head` pins the list to the commit the first page
 * started from, so commits made while the user scrolls don't shift later pages.
 */
export type CommitCursor = {
  /** Full SHA the first page started from; every later page walks history from here. */
  head: string
  /** Commits already returned (passed to `git log --skip`). */
  skip: number
  /**
   * Full SHA whose history is left out (`git log <head> ^<base>`), pinned like `head`; null = the
   * whole history of `head`.
   */
  base: string | null
}

/** One page of `git log`, newest first. */
export type CommitPage = {
  /** Commits on this page, newest first. */
  commits: CommitSummary[]
  /** Cursor for the next page, or null when this page reached the last commit in range. */
  next: CommitCursor | null
  /**
   * Ref whose commits were left out, as asked (e.g. `origin/main`), so the list holds only the
   * branch's own commits. Null when the whole history is listed.
   */
  baseRef: string | null
  /** How many commits the whole list holds (`git rev-list --count`); first page only, else null. */
  total: number | null
}
