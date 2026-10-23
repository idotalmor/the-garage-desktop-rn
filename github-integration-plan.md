# GitHub Section — Integration Plan

Goal: make the **GitHub section on the main page** (`DashboardHome.tsx`) real.
Today it renders the hard-coded `repositories` array from
`features/github/components/repository-cards.tsx`. After this work it shows:

1. **Repositories** the user works on, stored once in Firestore (deduped across users).
2. **Open PRs** for those repos, fetched from GitHub (CI, review state, comments).
3. **Local worktrees** found by scanning folders the user picks on their machine.

Builds on the in-progress Firestore layer (`features/firestore/*`,
`firestore-schema-plan.md`) and the GitHub sign-in item in `backlog.md`.

---

## Architecture at a glance

```
┌──────────── Electron main ─────────────┐        ┌──────── Renderer ────────┐
│ github/    OAuth loopback, token store,│  IPC   │ features/github/hooks/   │
│            GraphQL client (PRs, repos) │ <────> │   useGarageRepositories  │
│ worktrees/ folder picker, scanner,     │        │ features/firestore/      │
│            git CLI wrapper, sqlite     │        │   repositories.ts        │
└────────────────────────────────────────┘        │   userRepositories.ts    │
          │ git CLI          │ api.github.com     └───────────┬──────────────┘
          ▼                  ▼                                ▼
     local disk          GitHub API                       Firestore
```

- **Main process owns** anything privileged: GitHub token, filesystem scan, `git` calls.
  The token never reaches the renderer (except once, to link the Firebase account).
- **Renderer owns** Firestore (already set up there via `getDb()`) and merges the
  three sources into the existing `Repository` / `PullRequest` / `Worktree` types.
- **Local paths and worktrees stay local** (sqlite in `~/.devflow/`) — they are
  machine-specific and private. Firestore only stores shared repo metadata + a
  per-user link.

---

## Phase 0 — Prerequisites & decisions

- [ ] Commit the in-progress Firestore work (`features/firestore/`, auth-provider
      `upsertUser`, `firestore-schema-plan.md`) so this builds on a clean base.
- [ ] Register a **GitHub OAuth App** (Settings → Developer settings → OAuth Apps).
      Callback URL `http://127.0.0.1/` — GitHub ignores the port for loopback
      redirects, so the random-port server used by Google sign-in works.
- [ ] Add env vars to `src/shared/env.d.ts` + `.env`:
      `MAIN_VITE_GITHUB_CLIENT_ID`, `MAIN_VITE_GITHUB_CLIENT_SECRET`.
- [ ] Enable the GitHub provider in Firebase Auth (same client id/secret) and
      "Link accounts that use the same email address" (see `backlog.md`).
- [ ] Decide scopes: `repo` (private repos + PRs + checks) and `read:org`.
- [ ] Decide the open questions at the bottom of this file.

---

## Phase 1 — Local worktree scanner (no network needed)

Shippable on its own: the GitHub section shows real local repos/worktrees even
before GitHub is connected.

### 1.1 Scan roots (folder selection)

- [ ] `dialog.showOpenDialog({ properties: ['openDirectory', 'multiSelections'] })`
      — the user can add **multiple folders**, and each folder can be:
  - a single repo,
  - a single worktree,
  - a parent folder containing many repos/worktrees (e.g. `~/code`).
- [ ] Persist roots in sqlite `~/.devflow/worktrees.db`, table `scan_roots`
      (`id, path, added_at, last_scanned_at, max_depth`). Same pattern as
      `main/notes/repository.ts`.
- [ ] Add / remove / rescan roots from a small settings UI (see Phase 4).
- [ ] Dedupe roots: skip a root already covered by another root (realpath prefix).

### 1.2 Discovery walk

- [ ] Async BFS from each root, `maxDepth` default **4**.
- [ ] Skip: `node_modules`, `dist`, `out`, `build`, `.next`, `Pods`, `vendor`,
      `Library`, `.Trash`, hidden dirs (except known worktree containers like
      `.worktrees`), and symlinks (or follow once with realpath dedupe).
- [ ] Classify each dir:
  - `.git` **directory** → main working tree.
  - `.git` **file** with `gitdir: …/worktrees/<name>` → linked worktree.
  - `.git` file with `gitdir: …/modules/…` → submodule → ignore.
  - bare repo (`HEAD` + `objects/` + `refs/`, `core.bare=true`) → common in
    worktree-heavy layouts; record it, it has no working tree itself.
- [ ] Stop descending once a repo/worktree is found — its sibling worktrees are
      discovered via git (1.3), including ones **outside** the scanned roots.

### 1.3 Git inspection (per repo)

Run `git` with `execFile` (no shell), a timeout, and a concurrency limit (~6).

- [ ] Group key: `git rev-parse --path-format=absolute --git-common-dir`
      → all worktrees of one clone share it.
- [ ] `git worktree list --porcelain` → path, HEAD, branch, detached, locked, prunable.
- [ ] `git remote get-url origin` (+ `upstream` if present) → parse to
      `{ host, owner, name }` (see 1.4).
- [ ] Per worktree:
  - `git status --porcelain=v1 -z` → dirty file count (`hasUncommitted`, `changes`).
  - `git rev-list --left-right --count @{upstream}...HEAD` → ahead/behind (if tracking).
  - `git log -1 --format=%ct%x00%an` → last commit time + author.
- [ ] **macOS gotcha:** apps launched from Finder don't inherit the shell `PATH`.
      Resolve `git` explicitly (`/usr/bin/git`, `/opt/homebrew/bin/git`) or load
      the login-shell PATH at startup.
- [ ] **macOS gotcha:** folders picked via the dialog get TCC access; scanning
      other protected folders (Desktop/Documents) without picking them may prompt.

### 1.4 Remote URL normalization

- [ ] Pure function `parseRemoteUrl()` handling:
      `git@github.com:owner/repo.git`, `https://github.com/owner/repo(.git)`,
      `ssh://git@github.com/owner/repo`, `https://user@github.com/...`,
      SSH host aliases (`github.com-work`), GitHub Enterprise hosts.
- [ ] Output canonical slug `github.com/owner/repo` (lower-cased) — used for
      local grouping and for resolving the GitHub repo id in Phase 2.
- [ ] Repos with no GitHub remote → shown under "Local only".

### 1.5 Cache, refresh, IPC

- [ ] Cache results in sqlite (`local_repos`, `local_worktrees`) → instant render on startup.
- [ ] Refresh triggers: manual "Rescan", app start, window focus (throttled),
      `fs.watch` on each `<common-dir>/worktrees/` for add/remove, and a
      30–60s dirty-status poll for visible repos only.
- [ ] Emit progress events (`scanned N dirs, found M repos`) for a spinner.
- [ ] Files:
  - `src/shared/worktrees/channels.ts`, `src/shared/worktrees/types.ts`
  - `src/main/worktrees/{ipc,scanner,git,remote-url,repository}.ts`
  - `src/preload/index.ts` + `index.d.ts` → `api.worktrees.{listRoots, addRoots, removeRoot, rescan, list, onChanged}`
  - register `initWorktreesIpc()` in `src/main/index.ts`

---

## Phase 2 — GitHub integration (repos + PRs)

### 2.1 Connect GitHub

- [ ] `src/main/github/auth.ts` — loopback OAuth flow mirroring
      `main/auth/service.ts` (state, random port, `shell.openExternal`, timeout,
      cancel). Exchange code at `https://github.com/login/oauth/access_token`.
- [ ] **Store the token in main** — Firebase does not persist provider access
      tokens, so we keep our own: encrypt with Electron `safeStorage`, write to
      `~/.devflow/github-token.bin`. Never in Firestore.
- [ ] Return to the renderer only what's needed for
      `GithubAuthProvider.credential(token)` → `linkWithCredential(user, cred)`
      so the Firebase user gets the GitHub provider (`users/{uid}.firebase.providers`
      updates automatically via `upsertUser`). Handle
      `auth/credential-already-in-use` / `account-exists-with-different-credential`.
- [ ] `api.github.{connect, disconnect, status}` — status returns `{ connected, login, avatarUrl, scopes }`.
- [ ] Handle revoked/expired token (401) → status `disconnected`, prompt reconnect.

### 2.2 GitHub client (main process)

- [ ] `src/main/github/client.ts` — small `fetch` wrapper for GraphQL + REST
      (no new dependency), with ETag/rate-limit header handling.
- [ ] `viewer { login }` — for Mine/Others filtering.
- [ ] Resolve repo identity: `repository(owner, name) { databaseId nameWithOwner url isPrivate defaultBranchRef { name } owner { login } }`
      → `databaseId` is the stable numeric id used as the Firestore key (Phase 3).
- [ ] "Import from GitHub" list: `viewer.repositories(affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], orderBy: PUSHED_AT)`.
- [ ] PRs per repo (batch several repos per query with aliases):
  - `pullRequests(states: OPEN, first: 50, orderBy: {field: UPDATED_AT, direction: DESC})`
  - fields: `number title url isDraft updatedAt headRefName baseRefName author { login avatarUrl } reviewDecision comments { totalCount }`
  - latest commit CI: `commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }`
  - changes-requested comment count: `reviews(states: CHANGES_REQUESTED, last: 1) { nodes { comments { totalCount } } }`
  - optional recently merged: `states: MERGED, first: 5`
- [ ] Default branch CI + recent commits: `defaultBranchRef.target ... on Commit { statusCheckRollup { state } history(first: 10) { ... } }`
      → fills `masterCi` / `masterCommits`.
- [ ] PR commit list for `CommitHistoryModal` — fetched lazily on open.
- [ ] Polling: every 60–120s while a window is focused, paused when hidden;
      back off on rate limit; cache last response in sqlite for fast startup.
- [ ] Files: `src/shared/github/{channels,types}.ts`,
      `src/main/github/{auth,token-store,client,queries,ipc}.ts`, preload `api.github.*`.

### 2.3 Mapping to UI types

- [ ] CI: `SUCCESS → passing`, `FAILURE | ERROR → failing`, `PENDING | EXPECTED → in-progress`,
      `null → none` (add `'none'` to `CiStatus` + `CiBadge`).
- [ ] Status chip: `merged → Merged`, `reviewDecision APPROVED → Approved`,
      `CHANGES_REQUESTED → Changes requested`, `isDraft → Draft`, else `Open`.
- [ ] `time`: relative from `updatedAt`. `author`: `"You"` when `login === viewer.login`.

---

## Phase 3 — Firestore `repositories` without duplicates

### 3.1 The dedupe rule

**One document per GitHub repository, keyed deterministically:**

```
repositories/github_{databaseId}      e.g. repositories/github_123456789
```

- The numeric GitHub id survives renames and org transfers (owner/name does not).
- Two users with the same repo compute the **same doc id** → they point to the
  same document. No query-then-insert race, no duplicates.
- Replace `addDoc` in `features/firestore/repositories.ts` with
  `ensureRepository()` using a **transaction**: `get` → if missing `set` the full doc,
  else `update` only mutable fields (`name`, `url`, `defaultBranch`, `updatedAt`).
- This changes the "auto-generated ids" decision in `firestore-schema-plan.md`
  for `repositories` (same exception style as `users/{uid}` and
  `preferences/{uid}_{type}`) — update that doc too.
- Future providers follow the same pattern: `gitlab_{id}`, etc.

### 3.2 Shared repository document (no user/machine data)

```
repositories/github_{databaseId}
  provider: 'github'
  externalId: '123456789'          // string, matches doc id suffix
  host: 'github.com'
  owner: 'acme'
  name: 'acme/platform-api'        // nameWithOwner (existing field)
  url: 'https://github.com/acme/platform-api'
  defaultBranch: 'main'
  isPrivate: true
  slackChannels: []                // existing field
  createdBy: uid                   // provenance, immutable
  createdAt, updatedAt
```

Not stored here: local paths, worktrees, PRs (live from GitHub), tokens.

### 3.3 User ↔ repository link

Follows the existing `{uid}_{x}` convention used by `preferences`:

```
userRepositories/{uid}_github_{databaseId}
  userId: uid
  repositoryId: 'github_123456789'
  repo: DocumentReference -> repositories/github_123456789
  name: 'acme/platform-api'        // denormalized for list rendering
  source: 'local-scan' | 'github-import' | 'team'
  color: 'bg-violet-400'           // per-user UI choice
  hidden: false
  createdAt, updatedAt
```

- Dashboard query: `where('userId', '==', uid)` → resolve `repo` refs
  (`resolveRepos()` already exists).
- Teams keep linking via `teams.repos` (`DocumentReference[]`) — same doc ids,
  so team repos and personal repos converge on one document.
- Files: update `features/firestore/repositories.ts`, add
  `features/firestore/userRepositories.ts`.

### 3.4 Registration flow

- [ ] After a scan (Phase 1) with GitHub connected (Phase 2): for each local repo
      with a GitHub remote → resolve `databaseId` → `ensureRepository()` →
      upsert `userRepositories/{uid}_github_{id}`.
- [ ] Same for repos picked from "Import from GitHub" (no local clone needed).
- [ ] Local-only repos are never written to Firestore.
- [ ] Removing a repo from the dashboard deletes/hides only the user's link doc,
      never the shared `repositories` doc.

### 3.5 Security rules (replace the open TODO in `firestore-schema-plan.md`)

```firestore
match /repositories/{repoId} {
  allow get: if signedIn();
  allow list: if false;                       // no enumerating other users' repos
  allow create: if signedIn()
    && repoId == request.resource.data.provider + '_' + request.resource.data.externalId
    && request.resource.data.createdBy == request.auth.uid;
  allow update: if signedIn()
    && request.resource.data.provider == resource.data.provider
    && request.resource.data.externalId == resource.data.externalId
    && request.resource.data.createdBy == resource.data.createdBy;
  allow delete: if false;
}

match /userRepositories/{linkId} {
  allow get, list: if signedIn() && resource.data.userId == request.auth.uid;
  allow create, update: if signedIn()
    && request.resource.data.userId == request.auth.uid
    && linkId == request.auth.uid + '_' + request.resource.data.repositoryId
    && exists(/databases/$(database)/documents/repositories/$(request.resource.data.repositoryId));
  allow delete: if signedIn() && resource.data.userId == request.auth.uid;
}
```

- [ ] Known gap: rules can't verify the user really has GitHub access to the repo.
      Phase 5 adds a Cloud Function for that.

---

## Phase 4 — Wire the dashboard GitHub section

- [ ] `features/github/hooks/useGarageRepositories.ts` — merges:
      Firestore links (which repos) + GitHub PRs (`api.github`) + local worktrees
      (`api.worktrees`) → `Repository[]`.
- [ ] Replace the `repositories` mock import in `DashboardHome.tsx` with the hook;
      move mock data to a dev-only fixtures file (useful for offline UI work).
- [ ] Extend `features/github/components/types.ts`:
  - `Repository`: `id` (Firestore id), `fullName`, `url`, `isLocalOnly`
  - `PullRequest`: `url`, `headRefName`, `isDraft`, `authorLogin`, `authorAvatarUrl`
  - `Worktree`: `path`, `isMain`, `ahead`, `behind`, `lastCommitAt`, `isDetached`
- [ ] Link worktree ↔ PR: same repo and `worktree.branch === pr.headRefName`
      (check head repo owner for forks) → sets `worktree.prNumber`.
- [ ] Repo color: from `userRepositories.color`, fallback = stable hash of repo id.
- [ ] Empty / partial states in the GitHub section:
  - Not connected → "Connect GitHub" card.
  - No scan folders → "Add folders to scan" card (opens folder picker).
  - Scanning → skeleton cards + progress text.
  - Local-only repos → separate "Local" group (worktrees, no PRs).
  - GitHub error / rate limited → inline warning, keep cached data.
- [ ] Settings entry (section header `…` menu or `IntegrationsPage`):
      GitHub account (connected as @login / disconnect), scan folders list
      (add / remove / rescan), "Import from GitHub" picker, hide repo.
- [ ] Make cheap actions real now that `path` exists: Open in VS Code / Cursor /
      Terminal / Finder (`shell.openPath`, `code <path>`, `cursor <path>`).
      Everything else (Slack, babysitter, Fix CI, delete branch…) stays mocked.

---

## Phase 5 — Hardening (later)

- [ ] Cloud Function `registerRepository` (callable): verifies the caller's GitHub
      token can read the repo before creating/linking → then lock client
      `create` on `repositories` to `false`.
- [ ] Run large scans in an Electron `utilityProcess` so the main process never stalls.
- [ ] Watch-mode improvements (FSEvents) instead of polling.
- [ ] GitHub App instead of OAuth App (fine-grained, org-installable) if orgs block OAuth apps.
- [ ] Tests: add `vitest` for pure functions — `parseRemoteUrl`, worktree
      porcelain parser, `.git` file classifier, GraphQL → UI mappers.

---

## Suggested order of PRs

1. Commit current Firestore work (Phase 0).
2. Scanner + scan roots + IPC (Phase 1) → GitHub section shows real local worktrees.
3. GitHub connect + token store (2.1).
4. GitHub client + PR fetch + mapping (2.2–2.3).
5. Firestore `ensureRepository` + `userRepositories` + rules (Phase 3).
6. `useGarageRepositories` + empty states + settings (Phase 4).

---

## Open questions

- [ ] OAuth loopback (consistent with Google, needs an embedded client secret) vs.
      **device flow** (no secret, user types a code)? Plan assumes loopback.
- [ ] Which repos appear on the dashboard: only repos found locally + explicitly
      imported, or every repo the user can access on GitHub?
- [ ] Forks: key on `origin` (the fork) or `upstream` (the parent)? Plan assumes
      `origin`, storing upstream as extra info.
- [ ] PR lists: all PRs for linked repos (All/Mine/Others), or only PRs authored
      by / requesting review from the user?
- [ ] GitHub Enterprise support needed in the first version?
- [ ] Final collection names (`backlog.md` has "Rename the `repositories` collection").
- [ ] Should worktree metadata ever sync to Firestore (e.g. to show teammates'
      active branches)? Plan says no — local only.
