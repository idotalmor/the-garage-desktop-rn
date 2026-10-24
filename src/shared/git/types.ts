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
