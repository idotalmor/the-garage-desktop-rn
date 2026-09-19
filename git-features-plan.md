# Git Tab Feature Plan

## Current Git UI state

The Git / GitHub tab is implemented in `src/renderer/src/features/github/components/GitHubPage.tsx`.
The following capabilities are implemented in the Git tab as compact UI-only mocks:

- PR grid grouped by repository, with repository default/master branch cards
- PR metadata: number, title, author, time, CI status, comments, and uncommitted changes
- Review status chips: `Approved`, `Changes requested`, `Merged`, `Open`
- Contextual natural-language PR search and All/Mine/Others filtering
- "Spy" watch list for new PR topics
- All local worktrees grouped under their matching repository, including worktrees without PRs
- Actions per PR/worktree:
  - Send for review to the default Slack channel or a recipient menu (favorites first)
  - Babysitter toggle, CI rerun, Slack notification, lint, and Fix CI controls
  - Open in Cursor / VS Code / Terminal IDE menu placeholder
  - Commit history modal with commit-level CI dots/status
  - Link PR/task and link Markdown/context files through the Artifactory window
  - Jira button opening `https://jira` in a new tab
  - More actions: Delete local worktree, Delete remote branch
- Worktree Create PR / Open PR UI with generated title and description
- Visible injected automation payload preview
- Repository current-person filter/search affordances and the separate GitHub settings modal

## Requested features

### Discovery and filtering

- [x] See all my PRs with All/Mine/Others filtering, including PRs of other people
- [x] See all local worktrees, even if they do not yet have a PR
- [x] Make a PR from a worktree
- [x] See PR CI status with states: green, in progress, fail; with an action for fixing a failing run
- [x] Uncommitted changes indicator on each PR or worktree

### Actions and automations

- [x] Automation buttons per PR/card with mock HTTP triggers and injected PR data preview
- [x] Send a PR for review to a default Slack channel, or a menu to select a specific person
- [x] "Favorite" people listed first in the recipient menu
- [x] Delete local worktree and remote branch menus

### PR creation and linking

- [x] Open a PR from a worktree, with the title and description generated from the changes
- [x] Link a PR to a task
- [x] Link a task to Markdown and other context files in the artifact/artifactory

## Related app features already in the workspace

These existing features can connect to the Git work:

- **Dashboard** (`DashboardHome`) — main command center with prompt input
- **Notes** (`NotesPage`) — can host the artifact/context files mentioned above
- **Reader** (`ReaderPage`) — for reading linked Markdown artifacts
- **Code Explorer** (`CodeExplorerPage`) — cross-repo docs/podcast context
- **Newsletter** (`NewsletterPage`) — for announcing shipped PRs

## Scope note

All items above are implemented as UI-only mocked state and no-op actions. Real GitHub, Git, Slack, CI, Jira, IDE, task, and Artifactory integrations are intentionally out of scope.

## Open questions

- Should the artifact/artifactory live in Notes, a new directory, or a separate feature?
- Where do worktrees come from — a local filesystem scan or a Git integration backend?
- Which automations should ship first and what should their HTTP payload shape be?
