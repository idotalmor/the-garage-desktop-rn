# Git Tab Feature Plan

## Current Git UI state

The Git / GitHub tab is implemented in `src/renderer/src/features/github/components/GitHubPage.tsx`.
The following capabilities are already in place:

- PR grid grouped by repository
- PR metadata: number, title, author, time, CI status, comments
- Review status chips: `Approved`, `Changes requested`, `Merged`, `Open`
- Contextual natural-language search
- "Spy" watch list for new PR topics
- Actions per PR:
  - Send for review (Slack)
  - Choose Slack recipient
  - Babysitter toggle
  - Open on GitHub
  - Open in Cursor / IDE dropdown (Cursor, VS Code, Terminal)
  - More actions: Delete branch locally, Delete branch remotely

## Requested features

### Discovery and filtering

- [ ] See all my PRs with filtering, including PRs of other people
- [ ] See all local worktrees, even if they do not yet have a PR
- [ ] Make a PR from a worktree
- [ ] See PR CI status with states: green, in progress, fail; with an action for fixing a failing run
- [ ] Uncommitted changes indicator on each PR or worktree

### Actions and automations

- [ ] Automation buttons per PR: each triggers an HTTP call, with the option to inject data such as the PR link or PR data
- [ ] Send a PR for review to a default Slack channel, or a menu to select a specific person
- [ ] "Favorite" people listed first in the recipient menu
- [ ] Delete local worktree and remote branch

### PR creation and linking

- [ ] Open a PR from a worktree, with the title and description generated from the changes
- [ ] Link a PR to a task
- [ ] Link a task to Markdown and other context files in the artifact/artifactory

## Related app features already in the workspace

These existing features can connect to the Git work:

- **Dashboard** (`DashboardHome`) — main command center with prompt input
- **Notes** (`NotesPage`) — can host the artifact/context files mentioned above
- **Reader** (`ReaderPage`) — for reading linked Markdown artifacts
- **Code Explorer** (`CodeExplorerPage`) — cross-repo docs/podcast context
- **Newsletter** (`NewsletterPage`) — for announcing shipped PRs

## Open questions

- Should the artifact/artifactory live in Notes, a new directory, or a separate feature?
- Where do worktrees come from — a local filesystem scan or a Git integration backend?
- Which automations should ship first and what should their HTTP payload shape be?
