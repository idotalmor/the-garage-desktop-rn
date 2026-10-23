import { Ellipsis, GitBranch, GitCommit, MessageCircle, Plus } from 'lucide-react'
import { Button, Dropdown } from '@heroui/react'
import { GithubIcon, IdePicker, type GitHubCardSpec } from './GitHubCard'
import type { CiStatus, PullRequest, Repository, Worktree } from './types'

const favoritePeople = ['Maya Chen', 'Ava Patel', 'Noah Williams']
const otherPeople = ['Priya Shah', 'Liam Jones']

// Mock data for offline UI work. The dashboard now renders scanned local repositories
// (see hooks/useLocalRepositories.ts); kept so it can be re-applied later.
export const repositories: Repository[] = [
  {
    name: 'platform-api',
    detail: 'acme/platform-api',
    color: 'bg-violet-400',
    defaultBranch: 'main',
    masterCi: 'in-progress',
    masterCommits: [{ hash: 'm0a1s2t', message: 'Bump version', ciStatus: 'passing' }],
    prs: [
      {
        number: 184,
        title: 'Streamline deployment health checks',
        author: 'Maya Chen',
        time: '18 min ago',
        ciStatus: 'passing',
        comments: 0,
        status: 'Approved',
        hasUncommitted: false,
        task: 'OPS-184',
        commits: [{ hash: 'a1b2c3d', message: 'Add health check endpoint', ciStatus: 'passing' }]
      },
      {
        number: 181,
        title: 'Add retry policy to webhook delivery',
        author: 'Noah Williams',
        time: '2h ago',
        ciStatus: 'failing',
        comments: 2,
        status: 'Changes requested',
        hasUncommitted: true,
        commits: [{ hash: 'm1n2o3p', message: 'Add retry config', ciStatus: 'failing' }]
      },
      {
        number: 176,
        title: 'Update runtime configuration defaults',
        author: 'You',
        time: 'Yesterday',
        ciStatus: 'passing',
        comments: 0,
        status: 'Merged',
        hasUncommitted: false,
        task: 'DEV-176',
        commits: [{ hash: 'u7v8w9x', message: 'Tweak defaults', ciStatus: 'passing' }]
      }
    ],
    worktrees: [
      {
        name: 'health-checks',
        branch: 'feat/health-checks',
        author: 'Maya Chen',
        changes: '1 changed file',
        hasUncommitted: false,
        prNumber: 184
      },
      {
        name: 'webhook-retry',
        branch: 'fix/webhook-retry',
        author: 'Noah Williams',
        changes: '3 changed files',
        hasUncommitted: true,
        prNumber: 181
      },
      {
        name: 'task-192',
        branch: 'feat/task-192',
        author: 'You',
        changes: '7 changed files',
        hasUncommitted: true
      }
    ]
  },
  {
    name: 'web-console',
    detail: 'acme/web-console',
    color: 'bg-cyan-400',
    defaultBranch: 'master',
    masterCi: 'failing',
    masterCommits: [],
    prs: [
      {
        number: 92,
        title: 'New incident timeline filters',
        author: 'Ava Patel',
        time: '42 min ago',
        ciStatus: 'passing',
        comments: 0,
        status: 'Open',
        hasUncommitted: true,
        commits: [{ hash: 'g7h8i9j', message: 'Add timeline filter', ciStatus: 'passing' }]
      },
      {
        number: 88,
        title: 'Improve empty state for on-call',
        author: 'You',
        time: '3h ago',
        ciStatus: 'in-progress',
        comments: 0,
        status: 'Approved',
        hasUncommitted: false,
        commits: [{ hash: 'o1p2q3r', message: 'Empty state improvements', ciStatus: 'in-progress' }]
      }
    ],
    worktrees: [
      {
        name: 'incident-filters',
        branch: 'feat/incident-filters',
        author: 'Ava Patel',
        changes: '2 changed files',
        hasUncommitted: true,
        prNumber: 92
      },
      {
        name: 'on-call-copy',
        branch: 'chore/on-call-copy',
        author: 'You',
        changes: 'Clean',
        hasUncommitted: false,
        prNumber: 88
      },
      {
        name: 'design-spike',
        branch: 'spike/design-system',
        author: 'You',
        changes: 'Clean',
        hasUncommitted: false
      }
    ]
  }
]

const ciSurfaceClass: Record<CiStatus, string> = {
  passing: 'bg-success/50',
  'in-progress': 'bg-warning/50',
  failing: 'bg-danger/50',
  none: ''
}

const prStatusStyle: Record<string, string> = {
  'Changes requested': 'text-danger',
  Approved: 'text-success',
  Merged: 'text-violet-600',
  Open: 'text-warning'
}

export function buildRepositoryCards({
  repository,
  selectedRecipient,
  linkedTasks,
  babysitter,
  onRecipientChange,
  onHistory,
  onLinkTask,
  onOpenWorktree,
  onBabysitter
}: {
  repository: Repository
  selectedRecipient: string
  linkedTasks: Record<string, string>
  babysitter: Record<number, boolean>
  onRecipientChange: (value: string) => void
  onHistory: (title: string, hasUncommitted?: boolean) => void
  onLinkTask: (key: string) => void
  onOpenWorktree: (worktree: Worktree) => void
  onBabysitter: (number: number) => void
}): GitHubCardSpec[] {
  return [
    branchCard(repository, onHistory),
    ...repository.prs.map((pr) =>
      prCard(pr, repository.detail, {
        selectedRecipient,
        linkedTask: linkedTasks[`pr-${pr.number}`],
        isBabysitter: Boolean(babysitter[pr.number]),
        onRecipientChange,
        onHistory,
        onLinkTask: () => onLinkTask(`pr-${pr.number}`),
        onBabysitter: () => onBabysitter(pr.number)
      })
    ),
    ...repository.worktrees.map((tree) =>
      worktreeCard(tree, repository.detail, () => onOpenWorktree(tree), onHistory)
    )
  ]
}

function branchCard(repository: Repository, onHistory: (title: string) => void): GitHubCardSpec {
  const historyKey = `${repository.name}/${repository.defaultBranch}`
  return {
    key: `branch-${repository.id ?? repository.name}`,
    title: repository.defaultBranch,
    surfaceClass: ciSurfaceClass[repository.masterCi],
    history: { onOpen: () => onHistory(historyKey) },
    body: (
      <>
        <span className="line-clamp-2 flex items-center gap-1 text-xs text-accent">
          <GitBranch size={13} /> Default branch
        </span>
        <button
          type="button"
          className="line-clamp-2 w-fit cursor-pointer rounded-md border border-transparent px-1.5 py-0.5 text-left text-xs text-muted transition-colors hover:border-border hover:text-foreground"
          onClick={() => onHistory(historyKey)}
        >
          Latest commit {repository.masterCommits[0]?.message ?? 'No recent commits'}
        </button>
      </>
    ),
    footer: (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 rounded-lg text-xs"
        onPress={() => onHistory(historyKey)}
      >
        <GitCommit size={13} /> History
      </Button>
    )
  }
}

function prCard(
  pr: PullRequest,
  repoDetail: string,
  {
    selectedRecipient,
    linkedTask,
    isBabysitter,
    onRecipientChange,
    onHistory,
    onLinkTask,
    onBabysitter
  }: {
    selectedRecipient: string
    linkedTask?: string
    isBabysitter: boolean
    onRecipientChange: (value: string) => void
    onHistory: (title: string, hasUncommitted?: boolean) => void
    onLinkTask: () => void
    onBabysitter: () => void
  }
): GitHubCardSpec {
  const isMerged = pr.status === 'Merged'
  return {
    key: `pr-${pr.number}`,
    title: pr.title,
    surfaceClass: isMerged ? 'bg-violet-600/50' : ciSurfaceClass[pr.ciStatus],
    aside: (
      <>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="size-6 min-h-6 text-muted hover:text-foreground"
          onPress={() =>
            window.open(`https://github.com/${repoDetail}/pull/${pr.number}`, '_blank')
          }
          aria-label={`Open PR #${pr.number} on GitHub`}
        >
          <GithubIcon size={14} />
        </Button>
      </>
    ),
    history: {
      hasUncommitted: pr.hasUncommitted,
      onOpen: () => onHistory(`#${pr.number}`, pr.hasUncommitted)
    },
    body: (
      <>
        <p className="line-clamp-2 text-xs text-muted">Opened by {pr.author}</p>
        <div className="flex items-center gap-2">
          <p
            className={`line-clamp-2 text-sm font-semibold ${prStatusStyle[pr.status] ?? 'text-warning'}`}
          >
            {pr.status === 'Open' ? 'Waiting for review' : pr.status}
          </p>
          {/* Number of comments the PR reviewer left on the requested changes */}
          {pr.status === 'Changes requested' && pr.comments > 0 && (
            <span
              className="flex size-4 items-center justify-center rounded-full bg-danger/15 text-[10px] font-semibold text-danger"
              title="Review comments"
            >
              {pr.comments}
            </span>
          )}
        </div>
        <p className="line-clamp-2 flex items-center gap-1.5 px-1.5 py-0.5 text-xs text-muted">
          <span>
            #{pr.number} · {pr.commits.at(-1)?.message ?? 'No commits'} · {pr.time}
          </span>
          {pr.status === 'Changes requested' && pr.comments > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px]">
              <MessageCircle size={11} fill="currentColor" aria-hidden="true" />
              {pr.comments}
            </span>
          )}
        </p>
      </>
    ),
    footerDisabled: isMerged,
    footer: (
      <>
        <select
          value={selectedRecipient}
          onChange={(event) => onRecipientChange(event.target.value)}
          aria-label={`Review recipient for PR ${pr.number}`}
          className="h-7 max-w-36 rounded-lg border border-border bg-surface px-1 text-[10px]"
        >
          <option>Default · #eng-review</option>
          {favoritePeople.map((person) => (
            <option key={person}>★ {person}</option>
          ))}
          {otherPeople.map((person) => (
            <option key={person}>{person}</option>
          ))}
        </select>
        <Dropdown>
          <Dropdown.Trigger
            className="ml-auto flex size-7 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground"
            aria-label={`More actions for PR ${pr.number}`}
          >
            <Ellipsis size={14} />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu
              aria-label={`More actions for PR ${pr.number}`}
              onAction={(key) => {
                if (key === 'babysitter') onBabysitter()
                else if (key === 'history') onHistory(`#${pr.number}`, pr.hasUncommitted)
                else if (key === 'link-task') onLinkTask()
                else if (key === 'jira') window.open('https://jira', '_blank')
              }}
            >
              <Dropdown.Item id="send-review">Send review</Dropdown.Item>
              <Dropdown.Item id="babysitter">
                {isBabysitter ? 'Stop babysitter' : 'Babysitter'}
              </Dropdown.Item>
              {pr.ciStatus === 'failing' && <Dropdown.Item id="fix-ci">Fix CI</Dropdown.Item>}
              <Dropdown.Item id="rerun-ci">Rerun CI</Dropdown.Item>
              <Dropdown.Item id="slack">Notify Slack</Dropdown.Item>
              <Dropdown.Item id="lint">Run lint</Dropdown.Item>
              <Dropdown.Item id="history">History</Dropdown.Item>
              <Dropdown.Item id="link-task">{linkedTask ?? 'Link task'}</Dropdown.Item>
              <Dropdown.Item id="jira">Open in Jira</Dropdown.Item>
              <Dropdown.Item id="delete-worktree" variant="danger">
                Delete local worktree
              </Dropdown.Item>
              <Dropdown.Item id="delete-branch" variant="danger">
                Delete remote branch
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </>
    )
  }
}

function worktreeCard(
  worktree: Worktree,
  repoDetail: string,
  onOpen: () => void,
  onHistory: (title: string, hasUncommitted?: boolean) => void
): GitHubCardSpec {
  return {
    key: `worktree-${worktree.path ?? worktree.name}`,
    title: worktree.branch,
    overflowVisible: true,
    aside: worktree.prNumber ? (
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-6 min-h-6 text-muted hover:text-foreground"
        onPress={() =>
          window.open(`https://github.com/${repoDetail}/pull/${worktree.prNumber}`, '_blank')
        }
        aria-label={`Open PR #${worktree.prNumber} on GitHub`}
      >
        <GithubIcon size={14} />
      </Button>
    ) : (
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-6 min-h-6 text-muted hover:text-foreground"
        onPress={onOpen}
        aria-label="Create pull request"
      >
        <Plus size={14} />
      </Button>
    ),
    history: {
      hasUncommitted: worktree.hasUncommitted,
      onOpen: () => onHistory(worktree.branch, worktree.hasUncommitted)
    },
    body: (
      <>
        <span className="line-clamp-2 flex items-center gap-1 text-xs text-muted">
          <GitBranch size={13} /> {worktree.isMain ? 'Main checkout' : 'Local worktree'} ·{' '}
          {worktree.name}
        </span>
        <p className="line-clamp-2 text-xs text-muted" title={worktree.path}>
          {[worktree.author, worktree.changes].filter(Boolean).join(' · ')}
        </p>
      </>
    ),
    footer: <IdePicker worktreeName={worktree.name} />
  }
}
