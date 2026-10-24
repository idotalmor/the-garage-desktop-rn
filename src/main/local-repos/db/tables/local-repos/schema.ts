/** `local_repos` table: one row per repo on disk, keyed by a hash of its shared git directory. */
import type { CommitSummary, GitRemote } from '../../../../../shared/git/types'
import type { Json } from '../../../../sqlite'

export const LOCAL_REPOS_TABLE = 'local_repos'

export type LocalRepoDbEntity = {
  /** First 16 hex chars of the SHA-1 of `common_dir`, so the same repo always gets the same id. */
  id: string
  /**
   * Display name. The repo name from the primary remote URL (`git@github.com:me/app.git` → `app`).
   * Without a remote: the main checkout's folder name, else the git dir's folder name.
   */
  name: string
  /**
   * The git database shared by all checkouts (`git rev-parse --git-common-dir`), e.g.
   * `~/code/app/.git`, or `~/code/app.git` for a bare repo. Unique: one row per repo on disk.
   */
  common_dir: string
  /**
   * 1 = bare repo (`git clone --bare`): only the git database, no folder of files to work in; its
   * checkouts are linked worktrees. From `git rev-parse --is-bare-repository`. Not related to
   * uncommitted changes (those are `local_worktrees.changed_files`). 0 or 1.
   */
  is_bare: number
  /** Host of the primary remote: `github`, `other` (GitLab, Bitbucket…), or `none` (no remote). */
  provider: string
  /** `owner/repo` from the primary remote URL, e.g. `idotalmor/the-garage-desktop-rn`. Null without a remote. */
  full_name: string | null
  /**
   * Lowercase `host/owner/repo` from the primary remote URL. SSH, HTTPS and SSH host aliases give the
   * same value. Used to match the repo to GitHub; two clones of one repo share it. Null without a remote.
   */
  slug: string | null
  /** Raw URL of the primary remote (`origin`, else the first remote), as in `git remote -v`. */
  remote_url: string | null
  /** JSON `GitRemote[]`: every remote from `git config --get-regexp remote.*.url`, with its parsed slug. */
  remotes: Json<GitRemote[]>
  /**
   * The repo's main branch: what `origin/HEAD` points to, else the first of main/master/develop/trunk
   * that exists. Null if none is found.
   */
  default_branch: string | null
  /** JSON `CommitSummary`: latest commit on the default branch (the remote's copy when there is one). */
  default_branch_commit: Json<CommitSummary> | null
  /** When this repo was last read from disk by a scan or a live refresh (epoch ms). */
  scanned_at: number
  /**
   * When something last happened in one of its checkouts (epoch ms). A scan sets it from the newest
   * commit in any checkout; a live change that alters a checkout (commit, branch switch, file edit,
   * worktree added or removed) sets it to that moment. Never moves backwards.
   */
  updated_at: number
  /**
   * Place in the user's repo order in the UI (0 = first). Written only by `setLocalRepoPositions` when
   * the user picks a sort or drags a repo; scans never change it. Null until placed (shown last).
   */
  position: number | null
}

export const CREATE_LOCAL_REPOS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${LOCAL_REPOS_TABLE} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    common_dir TEXT NOT NULL UNIQUE,
    is_bare INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    full_name TEXT,
    slug TEXT,
    remote_url TEXT,
    remotes TEXT NOT NULL DEFAULT '[]',
    default_branch TEXT,
    default_branch_commit TEXT,
    scanned_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT 0,
    position INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_${LOCAL_REPOS_TABLE}_slug ON ${LOCAL_REPOS_TABLE}(slug);
`
