import { ArrowUp, Ellipsis, GitBranch, MessageCircle, Plus, Trash2 } from 'lucide-react'
import { Button, Dropdown } from '@heroui/react'
import {
  ChangesChip,
  CloneAction,
  CheckoutActions,
  FooterAction,
  GithubIcon,
  GitHubLink,
  PullChip,
  SyncChip,
  type GitHubCardSpec
} from './GitHubCard'
import { timeAgo } from '../time-ago'
import { openGitHubUrl } from '../../git-sources/open-url'
import type { CiStatus, OnHistory, PullRequest, Repository, Worktree } from './types'

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

/**
 * The branch part of the tracked remote (`origin/devin/xyz` → `devin/xyz`), shown only when the
 * remote branch name differs from the local one — otherwise the title already says it.
 */
function remoteBranch(worktree: Worktree): string | null {
  if (!worktree.upstream) return null
  const remote = worktree.upstream.split('/').slice(1).join('/')
  return remote === worktree.branch ? null : remote
}

/** Tooltip for the latest-commit button: "Latest commit · 2h ago". */
function latestCommitHint(timestamp?: number): string {
  return `Latest commit${timestamp ? ` · ${timeAgo(timestamp)}` : ''}`
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
  onBabysitter,
  onOpenIde,
  onOpenFolder,
  onDelete,
  pulling,
  onPull,
  cloning = false,
  checkoutDisabled = false,
  onClone
}: {
  repository: Repository
  selectedRecipient: string
  linkedTasks: Record<string, string>
  babysitter: Record<number, boolean>
  onRecipientChange: (value: string) => void
  onHistory: OnHistory
  onLinkTask: (key: string) => void
  onOpenWorktree: (worktree: Worktree) => void
  onBabysitter: (number: number) => void
  onOpenIde: (ide: string, path: string) => void
  onOpenFolder: (path: string) => void
  onDelete: (worktree: Worktree) => void
  /** Checkout paths with a pull running. */
  pulling: Record<string, boolean>
  onPull: (worktree: Worktree) => void
  cloning?: boolean
  checkoutDisabled?: boolean
  onClone?: (branch: string | null) => void
}): GitHubCardSpec[] {
  // The main clone usually has the default branch checked out; show that as one card, not two.
  const mainCheckout =
    repository.worktrees.find(
      (tree) =>
        tree.isMain && tree.path && !tree.isPrunable && tree.branch === repository.defaultBranch
    ) ??
    repository.worktrees.find(
      (tree) => tree.path && !tree.isPrunable && tree.branch === repository.defaultBranch
    )
  const actions = { onOpenIde, onOpenFolder, onDelete }
  const clone =
    !mainCheckout && onClone ? (
      <CloneAction
        linked={!!repository.isLocal}
        busy={cloning}
        disabled={checkoutDisabled}
        onClone={() =>
          onClone(repository.defaultBranch === 'HEAD' ? null : repository.defaultBranch)
        }
      />
    ) : undefined
  if (!repository.isLocal && repository.gitSourceRepo) return [remoteRepoCard(repository, clone)]
  return [
    branchCard(repository, onHistory, mainCheckout, actions, clone),
    ...repository.prs.map((pr) =>
      prCard(pr, repository.detail, {
        selectedRecipient,
        linkedTask: linkedTasks[`pr-${pr.number}`],
        linkedWorktree: repository.worktrees.find((tree) => tree.prNumber === pr.number),
        isBabysitter: Boolean(babysitter[pr.number]),
        onRecipientChange,
        onHistory,
        onLinkTask: () => onLinkTask(`pr-${pr.number}`),
        onBabysitter: () => onBabysitter(pr.number),
        onDelete
      })
    ),
    ...repository.worktrees
      .filter((tree) => tree !== mainCheckout)
      .map((tree) =>
        worktreeCard(
          tree,
          repository,
          () => onOpenWorktree(tree),
          onHistory,
          actions,
          {
            pulling: Boolean(tree.path && pulling[tree.path]),
            onPull: () => onPull(tree)
          },
          onClone && !tree.isDetached && (!tree.path || tree.isPrunable) ? (
            <CloneAction
              linked={!!repository.isLocal}
              busy={cloning}
              disabled={checkoutDisabled}
              onClone={() => onClone(tree.branch)}
            />
          ) : undefined
        )
      )
  ]
}

function remoteRepoCard(repository: Repository, clone?: React.ReactNode): GitHubCardSpec {
  return {
    key: `branch-${repository.id ?? repository.name}`,
    title: repository.defaultBranch,
    titleClass: 'text-accent',
    aside: <GitHubLink url={repository.githubUrl} label={`Open ${repository.detail} on GitHub`} />,
    body: (
      <>
        <p className="line-clamp-2 text-xs text-muted">
          {repository.gitSourceRepo?.description ?? repository.detail}
        </p>
        <p className="text-xs text-muted">Favorite · Not cloned locally</p>
      </>
    ),
    footer: clone
  }
}

/**
 * The default branch — always the first card, even when no checkout of it exists on this Mac.
 * When `mainCheckout` is given, it also shows that folder's local state and actions.
 */
function branchCard(
  repository: Repository,
  onHistory: OnHistory,
  mainCheckout: Worktree | undefined,
  actions: {
    onOpenIde: (ide: string, path: string) => void
    onOpenFolder: (path: string) => void
    onDelete: (worktree: Worktree) => void
  },
  clone?: React.ReactNode
): GitHubCardSpec {
  const historyKey = `${repository.name}/${repository.defaultBranch}`
  const hasUncommitted = mainCheckout?.hasUncommitted
  const source = repository.id ? { repoId: repository.id, worktreePath: null } : undefined
  const openHistory = (): void => onHistory(historyKey, hasUncommitted, source)
  return {
    key: `branch-${repository.id ?? repository.name}`,
    title: repository.defaultBranch,
    titleClass: 'text-accent',
    surfaceClass: ciSurfaceClass[repository.masterCi],
    overflowVisible: Boolean(mainCheckout),
    history: { onOpen: openHistory },
    aside: (
      <>
        <GitHubLink url={repository.githubUrl} label={`Open ${repository.detail} on GitHub`} />
        {mainCheckout?.changedFiles ? (
          <span className="self-center">
            <ChangesChip count={mainCheckout.changedFiles} />
          </span>
        ) : null}
      </>
    ),
    body: (
      <>
        {mainCheckout && (
          <p className="line-clamp-2 text-xs text-muted" title={mainCheckout.path}>
            {mainCheckout.changes}
          </p>
        )}
        <button
          type="button"
          title={latestCommitHint(repository.masterCommits[0]?.committedAt)}
          className="line-clamp-2 w-fit cursor-pointer rounded-md border border-transparent px-1.5 py-0.5 text-left text-xs text-muted transition-colors hover:border-border hover:text-foreground"
          onClick={openHistory}
        >
          {repository.masterCommits[0]?.message ?? 'No recent commits'}
        </button>
      </>
    ),
    footer: mainCheckout?.path ? <CheckoutActions worktree={mainCheckout} {...actions} /> : clone
  }
}

function prCard(
  pr: PullRequest,
  repoDetail: string,
  {
    selectedRecipient,
    linkedTask,
    linkedWorktree,
    isBabysitter,
    onRecipientChange,
    onHistory,
    onLinkTask,
    onBabysitter,
    onDelete
  }: {
    selectedRecipient: string
    linkedTask?: string
    linkedWorktree?: Worktree
    isBabysitter: boolean
    onRecipientChange: (value: string) => void
    onHistory: OnHistory
    onLinkTask: () => void
    onBabysitter: () => void
    onDelete: (worktree: Worktree) => void
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
          onPress={() => openGitHubUrl(`https://github.com/${repoDetail}/pull/${pr.number}`)}
          aria-label={`Open PR #${pr.number} on GitHub`}
        >
          <GithubIcon size={14} />
        </Button>
      </>
    ),
    history: { onOpen: () => onHistory(`#${pr.number}`, pr.hasUncommitted) },
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
        {linkedWorktree?.path && !linkedWorktree.isMain && (
          <FooterAction
            label={`Delete ${linkedWorktree.name}`}
            danger
            onPress={() => onDelete(linkedWorktree)}
          >
            <Trash2 size={13} />
          </FooterAction>
        )}
      </>
    )
  }
}

function worktreeCard(
  worktree: Worktree,
  repository: Repository,
  onOpen: () => void,
  onHistory: OnHistory,
  actions: {
    onOpenIde: (ide: string, path: string) => void
    onOpenFolder: (path: string) => void
    onDelete: (worktree: Worktree) => void
  },
  pull: { pulling: boolean; onPull: () => void },
  clone?: React.ReactNode
): GitHubCardSpec {
  const repoDetail = repository.detail
  const source =
    repository.id && worktree.path
      ? { repoId: repository.id, worktreePath: worktree.path }
      : undefined
  const openHistory = (): void => onHistory(worktree.branch, worktree.hasUncommitted, source)
  return {
    key: `worktree-${worktree.path ?? worktree.name}`,
    title: worktree.branch,
    overflowVisible: true,
    aside: (
      <>
        {worktree.prNumber ? (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-6 min-h-6 text-muted hover:text-foreground"
            onPress={() =>
              openGitHubUrl(`https://github.com/${repoDetail}/pull/${worktree.prNumber}`)
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
        )}
        {worktree.behind ? (
          <span className="self-center">
            <PullChip
              behind={worktree.behind}
              upstream={worktree.upstream}
              pulling={pull.pulling}
              onPull={pull.onPull}
            />
          </span>
        ) : null}
        {worktree.changedFiles ? (
          <span className="self-center">
            <ChangesChip count={worktree.changedFiles} />
          </span>
        ) : null}
      </>
    ),
    history: { onOpen: openHistory },
    body: (
      <>
        <span className="line-clamp-2 flex items-center gap-1 text-xs text-muted">
          <GitBranch size={13} /> {worktree.isMain ? 'Main checkout' : 'Local worktree'} ·{' '}
          {worktree.name}
          {remoteBranch(worktree) && ` → ${remoteBranch(worktree)}`}
        </span>
        {Boolean(worktree.ahead || worktree.isPrunable) && (
          <span className="flex flex-wrap items-center gap-1">
            {worktree.ahead ? (
              <SyncChip hint={`${worktree.ahead} commits ahead of upstream — push`}>
                <ArrowUp size={10} aria-hidden="true" />
                {worktree.ahead}
              </SyncChip>
            ) : null}
            {worktree.isPrunable && (
              <SyncChip danger hint="Folder is gone from disk">
                missing
              </SyncChip>
            )}
          </span>
        )}
        {worktree.lastCommitMessage && (
          <button
            type="button"
            title={latestCommitHint(worktree.lastCommitAt)}
            className="line-clamp-2 w-fit cursor-pointer rounded-md border border-transparent px-1.5 py-0.5 text-left text-xs text-muted transition-colors hover:border-border hover:text-foreground"
            onClick={openHistory}
          >
            {worktree.lastCommitMessage}
          </button>
        )}
      </>
    ),
    footer:
      worktree.path && !worktree.isPrunable ? (
        <CheckoutActions worktree={worktree} {...actions} />
      ) : (
        clone
      )
  }
}
