import {
  Bell,
  Bot,
  Check,
  CircleDot,
  CircleX,
  Clock3,
  FileText,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Link2,
  MessageCircle,
  Search,
  Settings2,
  Terminal,
  UserRound,
  Wrench,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { PromptInput, Widget } from '@heroui-pro/react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { GitHubSettingsModal } from './GitHubSettingsModal'

type CiStatus = 'passing' | 'failing' | 'in-progress'
type Commit = { hash: string; message: string; ciStatus: CiStatus }
type PullRequest = {
  number: number
  title: string
  author: string
  time: string
  ciStatus: CiStatus
  comments: number
  status: string
  hasUncommitted: boolean
  commits: Commit[]
  task?: string
}
type Worktree = {
  name: string
  branch: string
  author: string
  changes: string
  hasUncommitted: boolean
  prNumber?: number
}
type Repository = {
  name: string
  detail: string
  color: string
  defaultBranch: string
  masterCi: CiStatus
  masterCommits: Commit[]
  prs: PullRequest[]
  worktrees: Worktree[]
}

const favoritePeople = ['Maya Chen', 'Ava Patel', 'Noah Williams']
const otherPeople = ['Priya Shah', 'Liam Jones']
const repositories: Repository[] = [
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

function getSearchTerms(prompt: string): string[] {
  const stop = new Set(
    'a an and are as at be by for from has he in is it its me my of on or pr prs that the this to was what when where which who why with find search give show'.split(
      ' '
    )
  )
  return prompt
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stop.has(word))
}

function CiBadge({ status }: { status: CiStatus }): React.JSX.Element {
  const labels = { passing: 'Passing', 'in-progress': 'In progress', failing: 'Failing' }
  const icons = {
    passing: <Check size={12} />,
    'in-progress': <Clock3 size={12} />,
    failing: <CircleX size={12} />
  }
  const styles = {
    passing: 'bg-success/15 text-success',
    'in-progress': 'bg-warning/15 text-warning',
    failing: 'bg-danger/15 text-danger'
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${styles[status]}`}
    >
      {icons[status]}
      {labels[status]}
    </span>
  )
}

const ciSurfaceClass: Record<CiStatus, string> = {
  passing: 'bg-success/50',
  'in-progress': 'bg-warning/50',
  failing: 'bg-danger/50'
}

export function GitHubPage(): React.JSX.Element {
  const [searchPrompt, setSearchPrompt] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [spyInput, setSpyInput] = useState('')
  const [spies, setSpies] = useState<string[]>(['editor installation'])
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'others'>('all')
  const [activePromptTab, setActivePromptTab] = useState<'find' | 'watch'>('find')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'people' | 'slack'>('people')
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [selectedRecipient, setSelectedRecipient] = useState('Default · #eng-review')
  const [selectedHistory, setSelectedHistory] = useState<{
    title: string
    commits: Commit[]
  } | null>(null)
  const [selectedWorktree, setSelectedWorktree] = useState<{
    repo: Repository
    worktree: Worktree
  } | null>(null)
  const [linkedTasks, setLinkedTasks] = useState<Record<string, string>>({})
  const [babysitter, setBabysitter] = useState<Record<number, boolean>>({})
  const searchTerms = useMemo(() => getSearchTerms(searchQuery), [searchQuery])

  const visibleRepositories = useMemo(
    () =>
      repositories
        .map((repo) => {
          const matchesPerson = (author: string): boolean =>
            activeFilter === 'all' ||
            (activeFilter === 'mine' ? author === 'You' : author !== 'You')
          const matchesSearch = (value: string): boolean =>
            searchTerms.length === 0 ||
            searchTerms.some((term) => value.toLowerCase().includes(term))
          return {
            ...repo,
            prs: repo.prs.filter(
              (pr) =>
                matchesPerson(pr.author) && matchesSearch(`${pr.title} ${pr.author} ${repo.name}`)
            ),
            worktrees: repo.worktrees.filter(
              (tree) =>
                matchesPerson(tree.author) &&
                matchesSearch(`${tree.name} ${tree.branch} ${repo.name}`)
            )
          }
        })
        .filter((repo) => repo.prs.length > 0 || repo.worktrees.length > 0),
    [activeFilter, searchTerms]
  )

  const addSpy = (): void => {
    const value = spyInput.trim()
    if (value && !spies.includes(value)) setSpies([...spies, value])
    setSpyInput('')
  }
  const openContext = (): void => {
    window.open('?view=artifactory', '_blank', 'width=900,height=600')
  }
  const linkTask = (key: string): void =>
    setLinkedTasks((current) => ({ ...current, [key]: current[key] ? '' : 'DEV-192' }))

  return (
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-8 pt-14 sm:px-5 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow={
            <span className="flex items-center gap-1">
              <CircleDot size={12} /> Git workspace
            </span>
          }
          title="Review queue"
          description="Pull requests, CI signals, local worktrees, and lightweight review workflows."
        />
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" className="rounded-lg" onPress={() => {}}>
            <GitBranch size={15} /> Connect to Git
          </Button>
          <Button
            isIconOnly
            variant="outline"
            size="sm"
            aria-label="Git workspace notifications"
            onPress={() => {}}
          >
            <Bell size={16} />
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg" onPress={openContext}>
            <FileText size={15} /> Context
          </Button>
          <div className="flex gap-1.5">
            <CiBadge status="passing" />
            <CiBadge status="in-progress" />
            <CiBadge status="failing" />
          </div>
        </div>
      </header>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(['all', 'mine', 'others'] as const).map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={activeFilter === filter ? 'primary' : 'outline'}
              className="rounded-lg text-xs capitalize"
              onPress={() => setActiveFilter(filter)}
            >
              {filter === 'all' ? 'All PRs' : filter === 'mine' ? 'Mine' : 'Others'}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <UserRound size={14} /> Current person:{' '}
          <span className="font-medium text-foreground">{selectedPerson ?? 'You'}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-lg text-xs"
            onPress={() => {
              setSettingsTab('people')
              setIsSettingsOpen(true)
            }}
          >
            Choose
          </Button>
        </div>
      </section>

      <div className="mt-6 space-y-7">
        {visibleRepositories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <Search size={22} className="mx-auto text-muted" />
            <p className="mt-3 font-medium">No worktrees or PRs match that context</p>
          </div>
        ) : (
          visibleRepositories.map((repo) => (
            <RepositorySection
              key={repo.name}
              repository={repo}
              selectedPerson={selectedPerson}
              linkedTasks={linkedTasks}
              babysitter={babysitter}
              selectedRecipient={selectedRecipient}
              onRecipientChange={setSelectedRecipient}
              onOpenPeople={() => {
                setSettingsTab('people')
                setIsSettingsOpen(true)
              }}
              onOpenSettings={() => {
                setSettingsTab('slack')
                setIsSettingsOpen(true)
              }}
              onHistory={setSelectedHistory}
              onLinkTask={linkTask}
              onOpenWorktree={(worktree) => setSelectedWorktree({ repo, worktree })}
              onBabysitter={(number) =>
                setBabysitter({ ...babysitter, [number]: !babysitter[number] })
              }
            />
          ))
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <Widget>
          <Widget.Header>
            <Widget.Title>Ask the Git workspace</Widget.Title>
            <Widget.Description>
              Find PRs or watch for new ones matching a topic.
            </Widget.Description>
          </Widget.Header>
          <Widget.Content className="p-3">
            <div className="mb-3 flex gap-1 rounded-lg border border-border p-1">
              <Button
                size="sm"
                variant={activePromptTab === 'find' ? 'primary' : 'ghost'}
                className="flex-1 rounded-md text-xs"
                onPress={() => setActivePromptTab('find')}
              >
                Find PRs
              </Button>
              <Button
                size="sm"
                variant={activePromptTab === 'watch' ? 'primary' : 'ghost'}
                className="flex-1 rounded-md text-xs"
                onPress={() => setActivePromptTab('watch')}
              >
                Watch topics
              </Button>
            </div>
            <PromptInput
              value={activePromptTab === 'find' ? searchPrompt : spyInput}
              onValueChange={activePromptTab === 'find' ? setSearchPrompt : setSpyInput}
              onSubmit={() =>
                activePromptTab === 'find' ? setSearchQuery(searchPrompt.trim()) : addSpy()
              }
            >
              <PromptInput.Shell className="border border-border shadow-none">
                <PromptInput.Content>
                  <PromptInput.TextArea
                    className="min-h-10"
                    placeholder={
                      activePromptTab === 'find'
                        ? 'Find PRs about editor installation...'
                        : 'Watch for new PR topics...'
                    }
                  />
                </PromptInput.Content>
                <PromptInput.Toolbar>
                  <PromptInput.ToolbarStart>
                    <span className="text-xs text-muted">
                      {activePromptTab === 'find'
                        ? searchTerms.length
                          ? `Matching ${searchTerms.join(', ')}`
                          : 'Natural-language search'
                        : 'Spy list for new PRs'}
                    </span>
                  </PromptInput.ToolbarStart>
                  <PromptInput.ToolbarEnd>
                    <PromptInput.Send
                      isDisabled={
                        activePromptTab === 'find' ? !searchPrompt.trim() : !spyInput.trim()
                      }
                      aria-label={activePromptTab === 'find' ? 'Find PRs' : 'Add spy'}
                    >
                      {activePromptTab === 'find' ? <Search size={15} /> : <Bell size={15} />}
                    </PromptInput.Send>
                  </PromptInput.ToolbarEnd>
                </PromptInput.Toolbar>
              </PromptInput.Shell>
            </PromptInput>
            {activePromptTab === 'find' && searchQuery && (
              <p className="mt-2 text-xs text-muted" role="status">
                Searching for: {searchQuery} ·{' '}
                {visibleRepositories.length ? 'Matches shown above' : 'No matches'}
              </p>
            )}
            {activePromptTab === 'watch' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {spies.map((spy) => (
                  <span
                    key={spy}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs"
                  >
                    {spy}
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      className="size-4 min-h-4 rounded-full p-0"
                      onPress={() => setSpies(spies.filter((item) => item !== spy))}
                      aria-label={`Remove ${spy}`}
                    >
                      <X size={10} />
                    </Button>
                  </span>
                ))}
              </div>
            )}
          </Widget.Content>
        </Widget>
        <Widget>
          <Widget.Header>
            <Widget.Title>Automations</Widget.Title>
            <Widget.Description>
              Mock HTTP triggers with injected PR data preview.
            </Widget.Description>
          </Widget.Header>
          <Widget.Content className="space-y-2 p-3">
            <AutomationButton icon={<Bot size={13} />} label="Rerun CI" />
            <AutomationButton icon={<MessageCircle size={13} />} label="Notify Slack" />
            <AutomationButton icon={<Terminal size={13} />} label="Run lint" />
            <textarea
              readOnly
              value={
                '{\n  "prLink": "https://github.com/acme/platform-api/pull/184",\n  "repository": "platform-api",\n  "author": "Maya Chen"\n}'
              }
              aria-label="Injected automation payload preview"
              className="mt-2 h-24 w-full rounded-lg border border-border bg-surface-secondary p-2 font-mono text-[11px] text-foreground outline-none"
            />
          </Widget.Content>
        </Widget>
      </div>

      <GitHubSettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsTab}
        favoritePeople={favoritePeople}
        defaultSlackChannel="#eng-review"
        onClose={() => setIsSettingsOpen(false)}
        onSelectPerson={setSelectedPerson}
      />
      {selectedHistory && (
        <Modal
          title={`Commit history · ${selectedHistory.title}`}
          onClose={() => setSelectedHistory(null)}
        >
          <div className="space-y-2">
            {selectedHistory.commits.map((commit) => (
              <div
                key={commit.hash}
                className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs"
              >
                <CiBadge status={commit.ciStatus} />
                <GitCommit size={14} className="text-muted" />
                <code>{commit.hash}</code>
                <span className="flex-1">{commit.message}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {selectedWorktree && (
        <CreatePrModal
          repo={selectedWorktree.repo}
          worktree={selectedWorktree.worktree}
          onClose={() => setSelectedWorktree(null)}
          onContext={openContext}
        />
      )}
    </main>
  )
}

function AutomationButton({
  icon,
  label
}: {
  icon: React.ReactNode
  label: string
}): React.JSX.Element {
  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full justify-start rounded-lg text-xs"
      onPress={() => {}}
    >
      {icon}
      {label}
      <span className="ml-auto text-[10px] text-muted">HTTP mock</span>
    </Button>
  )
}
function RepositorySection({
  repository,
  selectedPerson,
  linkedTasks,
  babysitter,
  selectedRecipient,
  onRecipientChange,
  onOpenPeople,
  onOpenSettings,
  onHistory,
  onLinkTask,
  onOpenWorktree,
  onBabysitter
}: {
  repository: Repository
  selectedPerson: string | null
  linkedTasks: Record<string, string>
  babysitter: Record<number, boolean>
  selectedRecipient: string
  onRecipientChange: (value: string) => void
  onOpenPeople: () => void
  onOpenSettings: () => void
  onHistory: (history: { title: string; commits: Commit[] }) => void
  onLinkTask: (key: string) => void
  onOpenWorktree: (worktree: Worktree) => void
  onBabysitter: (number: number) => void
}): React.JSX.Element {
  return (
    <section aria-labelledby={`${repository.name}-heading`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`size-3 rounded-full ${repository.color}`} />
          <div>
            <h2 id={`${repository.name}-heading`} className="text-sm font-semibold">
              {repository.name}
            </h2>
            <p className="text-xs text-muted">
              {repository.detail} · {repository.prs.length} PRs · {repository.worktrees.length}{' '}
              worktrees
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="flex size-6 items-center justify-center rounded-full bg-surface-secondary text-[10px] font-semibold"
            aria-label={`Current person: ${selectedPerson ?? 'You'}`}
          >
            {(selectedPerson ?? 'You').charAt(0)}
          </span>
          <Button size="sm" variant="ghost" onPress={onOpenPeople}>
            {selectedPerson ?? 'Filter person'}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => {}}
            aria-label={`Search ${repository.name}`}
          >
            <Search size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={onOpenSettings}
            aria-label={`Open ${repository.name} settings`}
          >
            <Settings2 size={14} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Widget className={`h-full ${ciSurfaceClass[repository.masterCi]}`}>
          <Widget.Content className="m-1 flex min-h-[190px] flex-col gap-1.5 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-accent">
                <GitBranch size={13} /> Default branch
              </span>
              <CiBadge status={repository.masterCi} />
            </div>
            <h3 className="text-sm font-semibold">{repository.defaultBranch}</h3>
            <p className="flex-1 text-xs text-muted">
              Latest commit {repository.masterCommits[0]?.message ?? 'No recent commits'}
            </p>
            <div className="flex flex-wrap items-center gap-1 border-t border-separator pt-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg text-xs"
                onPress={() =>
                  onHistory({
                    title: `${repository.name}/${repository.defaultBranch}`,
                    commits: repository.masterCommits
                  })
                }
              >
                <GitCommit size={13} /> History
              </Button>
            </div>
          </Widget.Content>
        </Widget>
        {repository.prs.map((pr) => (
          <ReviewCard
            key={pr.number}
            pr={pr}
            selectedRecipient={selectedRecipient}
            linkedTask={linkedTasks[`pr-${pr.number}`]}
            isBabysitter={Boolean(babysitter[pr.number])}
            onRecipientChange={onRecipientChange}
            onHistory={onHistory}
            onLinkTask={() => onLinkTask(`pr-${pr.number}`)}
            onBabysitter={() => onBabysitter(pr.number)}
          />
        ))}
      </div>
      <div className="rounded-lg border border-dashed border-border bg-surface-secondary/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Local worktrees</p>
            <p className="text-[11px] text-muted">
              Every checkout, including branches without a PR.
            </p>
          </div>
          <GitBranch size={15} className="text-muted" />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {repository.worktrees.map((tree) => (
            <WorktreeCard key={tree.name} worktree={tree} onOpen={() => onOpenWorktree(tree)} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewCard({
  pr,
  selectedRecipient,
  linkedTask,
  isBabysitter,
  onRecipientChange,
  onHistory,
  onLinkTask,
  onBabysitter
}: {
  pr: PullRequest
  selectedRecipient: string
  linkedTask?: string
  isBabysitter: boolean
  onRecipientChange: (value: string) => void
  onHistory: (history: { title: string; commits: Commit[] }) => void
  onLinkTask: () => void
  onBabysitter: () => void
}): React.JSX.Element {
  return (
    <Widget className={`h-full ${ciSurfaceClass[pr.ciStatus]}`}>
      <Widget.Content className="m-1 flex min-h-[190px] flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted">
            <GitPullRequest size={13} /> #{pr.number} · {pr.time}
          </span>
          <CiBadge status={pr.ciStatus} />
        </div>
        <h3 className="text-sm font-semibold">{pr.title}</h3>
        <p className="text-xs text-muted">
          Opened by {pr.author} · {pr.status} · {pr.comments} comments
        </p>
        {pr.hasUncommitted && (
          <span className="w-fit rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
            Uncommitted changes
          </span>
        )}
        <p className="flex-1 text-xs text-muted">{pr.commits.at(-1)?.message ?? 'No commits'}</p>
        <div className="flex flex-wrap items-center gap-1 border-t border-separator pt-2">
          <Button size="sm" variant="primary" className="h-7 rounded-lg text-xs" onPress={() => {}}>
            <MessageCircle size={13} /> Send review
          </Button>
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
          <Button
            size="sm"
            variant={isBabysitter ? 'primary' : 'ghost'}
            className="h-7 rounded-lg text-xs"
            onPress={onBabysitter}
          >
            <Bot size={13} /> Babysitter
          </Button>
          {pr.ciStatus === 'failing' && (
            <Button
              size="sm"
              variant="danger-soft"
              className="h-7 rounded-lg text-xs"
              onPress={() => {}}
            >
              <Wrench size={13} /> Fix CI
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" className="h-6 rounded text-[10px]" onPress={() => {}}>
            <Bot size={11} /> Rerun CI
          </Button>
          <Button size="sm" variant="ghost" className="h-6 rounded text-[10px]" onPress={() => {}}>
            <MessageCircle size={11} /> Slack
          </Button>
          <Button size="sm" variant="ghost" className="h-6 rounded text-[10px]" onPress={() => {}}>
            <Terminal size={11} /> Lint
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 rounded text-[10px]"
            onPress={() => onHistory({ title: `#${pr.number}`, commits: pr.commits })}
          >
            <GitCommit size={11} /> History
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 rounded text-[10px]"
            onPress={onLinkTask}
          >
            <Link2 size={11} /> {linkedTask ?? 'Link task'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 rounded text-[10px]"
            onPress={() => window.open('https://github.com', '_blank')}
          >
            <GitPullRequest size={11} /> GitHub
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 rounded text-[10px]"
            onPress={() => window.open('https://jira', '_blank')}
          >
            <FileText size={11} /> Jira
          </Button>
          <select
            aria-label={`More actions for PR ${pr.number}`}
            className="h-6 rounded border border-border bg-surface px-1 text-[10px]"
            defaultValue=""
          >
            <option value="" disabled>
              •••
            </option>
            <option>Delete local worktree</option>
            <option>Delete remote branch</option>
          </select>
        </div>
      </Widget.Content>
    </Widget>
  )
}

function WorktreeCard({
  worktree,
  onOpen
}: {
  worktree: Worktree
  onOpen: () => void
}): React.JSX.Element {
  return (
    <Card className="rounded-lg">
      <Card.Content className="space-y-2 p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold">{worktree.name}</p>
            <p className="font-mono text-[10px] text-muted">{worktree.branch}</p>
          </div>
          {worktree.hasUncommitted && (
            <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
              Changes
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted">
          {worktree.author} · {worktree.changes}
        </p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="primary"
            className="h-7 flex-1 rounded-lg text-xs"
            onPress={onOpen}
          >
            <GitPullRequest size={12} /> {worktree.prNumber ? 'Open PR' : 'Create PR'}
          </Button>
          <select
            aria-label={`Open ${worktree.name} in IDE`}
            defaultValue=""
            className="h-7 rounded-lg border border-border bg-surface px-1 text-[10px]"
          >
            <option value="" disabled>
              IDE
            </option>
            <option>Cursor</option>
            <option>VS Code</option>
            <option>Terminal</option>
          </select>
        </div>
      </Card.Content>
    </Card>
  )
}

function Modal({
  title,
  children,
  onClose
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <Card className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
        <Card.Header className="flex items-center justify-between border-b border-separator px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <Button isIconOnly size="sm" variant="ghost" onPress={onClose} aria-label="Close">
            <X size={14} />
          </Button>
        </Card.Header>
        <Card.Content className="p-4">{children}</Card.Content>
      </Card>
    </div>
  )
}
function CreatePrModal({
  repo,
  worktree,
  onClose,
  onContext
}: {
  repo: Repository
  worktree: Worktree
  onClose: () => void
  onContext: () => void
}): React.JSX.Element {
  const [title, setTitle] = useState(
    worktree.prNumber ? 'Open existing pull request' : `Changes from ${worktree.name}`
  )
  const [description, setDescription] = useState(
    `Generated from ${worktree.branch}.\n\nChanged files: ${worktree.changes}.`
  )
  return (
    <Modal
      title={worktree.prNumber ? `Open PR #${worktree.prNumber}` : 'Create pull request'}
      onClose={onClose}
    >
      <div className="space-y-3">
        <p className="text-xs text-muted">
          {repo.detail} · {worktree.branch} → {repo.defaultBranch}
        </p>
        <label className="block text-xs font-medium">
          Generated title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-secondary p-2 text-xs"
          />
        </label>
        <label className="block text-xs font-medium">
          Generated description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 h-24 w-full rounded-lg border border-border bg-surface-secondary p-2 text-xs"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-lg text-xs" onPress={onContext}>
            <FileText size={13} /> Link context files
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg text-xs" onPress={() => {}}>
            <Link2 size={13} /> Link task
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="ml-auto rounded-lg text-xs"
            onPress={onClose}
          >
            Create PR (mock)
          </Button>
        </div>
      </div>
    </Modal>
  )
}
