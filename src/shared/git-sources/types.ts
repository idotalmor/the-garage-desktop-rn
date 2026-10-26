/** Provider-neutral contracts for connected Git accounts and their repo catalog. Tokens never cross IPC. */
export type GitSourceProvider = 'github'

export type GitSource = {
  /** Stable provider/account id, assigned from the provider's numeric user id. */
  id: string
  /** Adapter that owns this account. */
  provider: GitSourceProvider
  /** Provider's stable user id. */
  externalId: string
  /** Account login returned by the provider. */
  login: string
  /** Profile image URL returned by the provider. */
  avatarUrl: string
  /** Granted OAuth scopes returned during authorization. */
  scopes: string[]
  /** When authorization completed, in epoch milliseconds. */
  connectedAt: number
}

export type GitSourceRepo = {
  /** Connected account that can access this repo. */
  sourceId: string
  /** Stable repo id returned by the provider. */
  externalId: string
  /** Repo name returned by the provider. */
  name: string
  /** Owner/repo returned by the provider. */
  fullName: string
  /** Canonical provider host. */
  host: string
  /** Browser URL returned by the provider. */
  url: string
  /** Clone URL returned by the provider. */
  cloneUrl: string
  /** SSH clone URL returned by the provider. */
  sshUrl: string
  /** Default branch returned by the provider. */
  defaultBranch: string | null
  /** Whether the provider marks the repo private. */
  isPrivate: boolean
  /** Whether the provider marks the repo archived. */
  isArchived: boolean
  /** Whether the provider marks the repo as a fork. */
  isFork: boolean
  /** Provider's description, if present. */
  description: string | null
  /** Last push timestamp returned by the provider, in epoch milliseconds. */
  pushedAt: number | null
  /** Last update timestamp returned by the provider, in epoch milliseconds. */
  updatedAt: number
}

export type GitSourceFavorite = {
  /** Account through which the repo was chosen. */
  sourceId: string
  /** Stable provider repo id. */
  externalId: string
}

export type GitSourceAuthorization = {
  /** Code the user enters in the browser; not the secret device code. */
  userCode: string
  /** Provider's browser authorization page. */
  verificationUri: string
  /** When the device code expires, in epoch milliseconds. */
  expiresAt: number
}

export type GitSourcesSnapshot = {
  /** Connected accounts, without credentials. */
  sources: GitSource[]
  /** Cached repo metadata, including catalog pages the user has browsed. */
  repos: GitSourceRepo[]
  /** Explicit in-app favorites; not GitHub stars. */
  favorites: GitSourceFavorite[]
  /** Pending authorization instructions, or null. */
  authorization: GitSourceAuthorization | null
}

export type CheckoutRequest = {
  /** Existing local clone, or a cached repo from a connected provider account. */
  repo:
    | {
        /** Reuse an already scanned local clone. */
        kind: 'local'
        /** Stable LocalRepo id. */
        id: string
      }
    | {
        /** Resolve the repo from a connected account's cache. */
        kind: 'remote'
        /** Connected account owning the cached repo. */
        sourceId: string
        /** Provider's stable repo id. */
        externalId: string
      }
    | {
        /** Clone a user-pasted GitHub repo URL. */
        kind: 'url'
        /** HTTPS or SSH GitHub repo URL without credentials. */
        url: string
      }
  /** Branch to check out; null means the repo's default branch. */
  branch: string | null
}

export type CheckoutPlan = {
  /** Clone for a new repo, linked worktree when a local clone already exists. */
  mode: 'clone' | 'worktree'
  /** Suggested new folder name under the parent selected by the user. */
  folderName: string
  /** Safe sibling location derived from existing checkouts, or null if none exist. */
  suggestedParent: string | null
  /** Existing clone to reuse, or null for a first clone. */
  localRepoId: string | null
  /** Validated branch name, or null for an empty/default clone. */
  branch: string | null
}

export type GitSourceRepoPage = {
  /** Repos on this page only. */
  repos: GitSourceRepo[]
  /** Next page number, or null at the end. */
  nextPage: number | null
}
