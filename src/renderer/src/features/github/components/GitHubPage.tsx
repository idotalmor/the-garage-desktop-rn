import {
  Bell,
  Bot,
  CircleDot,
  CircleX,
  FileText,
  GitBranch,
  GitPullRequest,
  MessageCircle,
  Search,
  Settings2,
  Terminal,
  Wrench,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { PromptInput, Widget } from '@heroui-pro/react'
import { PageHeader } from '../../../shared/components/PageHeader'

type MetricChipProps = {
  count: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  tone: 'neutral' | 'success' | 'danger' | 'warning'
}

function MetricChip({ count, label, icon: Icon, tone }: MetricChipProps): React.JSX.Element {
  const toneClass = {
    neutral: 'border-border bg-surface-tertiary text-foreground',
    success: 'border-success bg-success text-success-foreground',
    danger: 'border-danger bg-danger text-danger-foreground',
    warning: 'border-warning bg-warning text-warning-foreground'
  }[tone]

  return (
    <span
      className={`group inline-flex h-7 max-w-14 cursor-default items-center overflow-hidden whitespace-nowrap rounded-lg border px-1.5 text-xs transition-[max-width] duration-200 ease-out hover:max-w-40 focus-visible:max-w-40 ${toneClass}`}
      tabIndex={0}
      aria-label={`${count} ${label}`}
    >
      <Icon size={13} className="shrink-0" aria-hidden={true} />
      <span className="ml-1 font-semibold">{count}</span>
      <span className="ml-0 max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin] duration-200 group-hover:ml-1 group-hover:max-w-28 group-hover:opacity-100 group-focus-visible:ml-1 group-focus-visible:max-w-28 group-focus-visible:opacity-100">
        {label}
      </span>
    </span>
  )
}

function getSearchTerms(prompt: string): string[] {
  const stop = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'me',
    'my',
    'of',
    'on',
    'or',
    'pr',
    'prs',
    'that',
    'the',
    'this',
    'to',
    'was',
    'what',
    'when',
    'where',
    'which',
    'who',
    'why',
    'with',
    'find',
    'search',
    'give',
    'show'
  ])
  return prompt
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stop.has(word))
}

export function GitHubPage(): React.JSX.Element {
  const [searchPrompt, setSearchPrompt] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [spyInput, setSpyInput] = useState('')
  const [spies, setSpies] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'others'>('all')
  const [activePromptTab, setActivePromptTab] = useState<'find' | 'watch'>('find')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'people' | 'slack'>('people')
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)

  const searchTerms = useMemo(() => getSearchTerms(searchQuery), [searchQuery])

  const filteredRepositories = useMemo(() => {
    let next = repositories
    if (activeFilter !== 'all') {
      next = next
        .map((repository) => ({
          ...repository,
          prs: repository.prs.filter((pr) =>
            activeFilter === 'mine' ? pr.author === 'You' : pr.author !== 'You'
          )
        }))
        .filter((repository) => repository.prs.length > 0)
    }
    if (searchTerms.length === 0) return next
    return next
      .map((repository) => ({
        ...repository,
        prs: repository.prs.filter((pr) =>
          searchTerms.some((term) => `${pr.title} ${pr.author}`.toLowerCase().includes(term))
        )
      }))
      .filter((repository) => repository.prs.length > 0)
  }, [activeFilter, searchTerms])

  const addSpy = (term: string): void => {
    const t = term.trim()
    if (t && !spies.includes(t)) setSpies((prev) => [...prev, t])
    setSpyInput('')
  }

  const removeSpy = (term: string): void => {
    setSpies((prev) => prev.filter((s) => s !== term))
  }

  const clearSearch = (): void => {
    setSearchPrompt('')
    setSearchQuery('')
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-6 pt-14 sm:px-5 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow={
            <span className="flex items-center gap-1">
              <CircleDot size={12} aria-hidden={true} />
              Git workspace
            </span>
          }
          title="Review queue"
          description="Pull requests, CI signals, and lightweight review workflows — grouped by repository."
        />
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" className="rounded-lg" onPress={() => {}}>
            <GitBranch size={15} aria-hidden="true" />
            Connect to Git
          </Button>
          <Button isIconOnly variant="outline" size="sm" aria-label="Git workspace notifications">
            <Bell size={16} aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onPress={() => window.open('?view=artifactory', '_blank', 'width=900,height=600')}
          >
            <FileText size={15} aria-hidden="true" />
            Context
          </Button>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Pull request overview">
            <MetricChip count="4" label="draft" icon={FileText} tone="neutral" />
            <MetricChip count="7" label="open" icon={GitPullRequest} tone="success" />
            <MetricChip count="2" label="failing" icon={CircleX} tone="danger" />
            <MetricChip count="3" label="commented" icon={MessageCircle} tone="warning" />
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <section>
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
                  Find
                </Button>
                <Button
                  size="sm"
                  variant={activePromptTab === 'watch' ? 'primary' : 'ghost'}
                  className="flex-1 rounded-md text-xs"
                  onPress={() => setActivePromptTab('watch')}
                >
                  Watch
                </Button>
              </div>

              <PromptInput
                value={activePromptTab === 'find' ? searchPrompt : spyInput}
                onValueChange={activePromptTab === 'find' ? setSearchPrompt : setSpyInput}
                onSubmit={() => {
                  if (activePromptTab === 'find') {
                    setSearchQuery(searchPrompt.trim())
                  } else {
                    addSpy(spyInput)
                  }
                }}
              >
                <PromptInput.Shell className="border border-border shadow-none">
                  <PromptInput.Content>
                    <PromptInput.TextArea
                      className="min-h-10"
                      placeholder={
                        activePromptTab === 'find'
                          ? 'Find me a PR for editor installation...'
                          : 'Watch for PRs about editor installation...'
                      }
                    />
                  </PromptInput.Content>
                  <PromptInput.Toolbar>
                    <PromptInput.ToolbarStart>
                      <span className="text-xs text-muted">
                        {activePromptTab === 'find'
                          ? searchTerms.length > 0
                            ? `Matching ${searchTerms.join(', ')}`
                            : 'Enter a context to search'
                          : 'Enter a topic to watch'}
                      </span>
                    </PromptInput.ToolbarStart>
                    <PromptInput.ToolbarEnd>
                      {activePromptTab === 'find' && searchQuery && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-lg text-xs"
                          onPress={clearSearch}
                        >
                          Clear
                        </Button>
                      )}
                      <PromptInput.Send
                        isDisabled={
                          activePromptTab === 'find' ? !searchPrompt.trim() : !spyInput.trim()
                        }
                        aria-label={activePromptTab === 'find' ? 'Find PRs' : 'Add spy'}
                      >
                        {activePromptTab === 'find' ? (
                          <Search size={15} aria-hidden="true" />
                        ) : (
                          <Bell size={15} aria-hidden="true" />
                        )}
                      </PromptInput.Send>
                    </PromptInput.ToolbarEnd>
                  </PromptInput.Toolbar>
                </PromptInput.Shell>
              </PromptInput>

              {activePromptTab === 'find'
                ? searchQuery && (
                    <p className="mt-2 text-xs text-muted" role="status">
                      Searching for: {searchQuery}
                      {filteredRepositories.length === 0 && ' · No matches'}
                    </p>
                  )
                : spies.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {spies.map((spy) => (
                        <div
                          key={spy}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs text-foreground"
                        >
                          <span>{spy}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            className="size-4 min-h-4 rounded-full p-0 text-muted"
                            onPress={() => removeSpy(spy)}
                            aria-label={`Remove ${spy}`}
                          >
                            <X size={10} aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
            </Widget.Content>
          </Widget>
        </section>

        <section>
          <Widget>
            <Widget.Header>
              <Widget.Title>Automations</Widget.Title>
              <Widget.Description>
                One-click HTTP triggers that can inject PR data.
              </Widget.Description>
            </Widget.Header>
            <Widget.Content className="p-3">
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start rounded-lg text-xs"
                  onPress={() => {}}
                >
                  <Bot size={13} aria-hidden="true" />
                  Trigger CI re-run
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start rounded-lg text-xs"
                  onPress={() => {}}
                >
                  <MessageCircle size={13} aria-hidden="true" />
                  Notify Slack
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start rounded-lg text-xs"
                  onPress={() => {}}
                >
                  <Terminal size={13} aria-hidden="true" />
                  Run lint on PR
                </Button>
              </div>
              <div className="mt-3">
                <span className="text-xs text-muted">Payload (injected data)</span>
                <textarea
                  className="mt-1 h-20 w-full rounded-lg border border-border bg-surface-secondary p-2 text-xs text-foreground outline-none"
                  placeholder='{ "prLink": "...", "author": "..." }'
                  readOnly
                />
              </div>
            </Widget.Content>
          </Widget>
        </section>
      </div>

      <section className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'mine', 'others'] as const).map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={activeFilter === filter ? 'primary' : 'outline'}
              className="rounded-lg text-xs capitalize"
              onPress={() => setActiveFilter(filter)}
            >
              {filter} PRs
            </Button>
          ))}
        </div>
      </section>

      <div className="mt-6 space-y-7">
        {filteredRepositories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <Search size={22} className="text-muted" aria-hidden="true" />
            <p className="mt-4 font-medium">No PRs match that context</p>
            <p className="mt-1 text-sm text-muted">
              Try a different description or clear the search.
            </p>
          </div>
        ) : (
          filteredRepositories.map((repository) => (
            <RepositorySection
              key={repository.name}
              repository={repository}
              selectedPerson={selectedPerson}
              onOpenPeople={() => {
                setSettingsTab('people')
                setIsSettingsOpen(true)
              }}
              onOpenSettings={() => {
                setSettingsTab('slack')
                setIsSettingsOpen(true)
              }}
            />
          ))
        )}
      </div>
      <GitHubSettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsTab}
        favoritePeople={favoritePeople}
        defaultSlackChannel="#eng-review"
        onClose={() => setIsSettingsOpen(false)}
        onSelectPerson={(person) => setSelectedPerson(person)}
      />
    </main>
  )
}

type CiStatus = 'passing' | 'failing' | 'in-progress' | 'none'
type Commit = { hash: string; message: string; ciStatus: CiStatus }
type PullRequest = {
  number: number
  title: string
  author: string
  time: string
  ciStatus: Exclude<CiStatus, 'none'>
  comments: number
  status: string
  hasUncommitted: boolean
  commits: Commit[]
}
type Repository = {
  name: string
  detail: string
  color: string
  masterCi: string
  masterCommits: Commit[]
  prs: PullRequest[]
}
const repositories: Repository[] = [
  {
    name: 'platform-api',
    detail: 'acme/platform-api',
    color: 'bg-violet-400',
    masterCi: 'In-progress',
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
        commits: [{ hash: 'u7v8w9x', message: 'Tweak defaults', ciStatus: 'passing' }]
      }
    ]
  },
  {
    name: 'web-console',
    detail: 'acme/web-console',
    color: 'bg-cyan-400',
    masterCi: 'Failing',
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
        ciStatus: 'passing',
        comments: 0,
        status: 'Approved',
        hasUncommitted: false,
        commits: [{ hash: 'o1p2q3r', message: 'Empty state improvements', ciStatus: 'passing' }]
      }
    ]
  }
]
const favoritePeople = ['Maya Chen', 'Ava Patel', 'Noah Williams']
function RepositorySection({
  repository,
  selectedPerson,
  onOpenPeople,
  onOpenSettings
}: {
  repository: Repository
  selectedPerson: string | null
  onOpenPeople: () => void
  onOpenSettings: () => void
}): React.JSX.Element {
  return (
    <section aria-labelledby={`${repository.name}-heading`} className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 id={`${repository.name}-heading`} className="text-sm font-semibold">
            {repository.name}
          </h2>
          <p className="text-xs text-muted">
            {repository.detail} · {repository.prs.length} open
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onPress={onOpenPeople}>
            {selectedPerson ?? 'Filter'}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={onOpenSettings}
            aria-label="Review settings"
          >
            <Settings2 size={14} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {repository.prs.map((pr) => (
          <ReviewCard key={pr.number} pr={pr} />
        ))}
      </div>
    </section>
  )
}
function ReviewCard({ pr }: { pr: PullRequest }): React.JSX.Element {
  return (
    <Card className="h-full rounded-lg">
      <Card.Content className="flex min-h-[132px] flex-col gap-1.5 p-2">
        <div className="flex justify-between">
          <span className="text-xs text-muted">
            <GitPullRequest size={13} /> #{pr.number} · {pr.time}
          </span>
          <span
            className={`size-2 rounded-full ${pr.ciStatus === 'passing' ? 'bg-success' : pr.ciStatus === 'failing' ? 'bg-danger' : 'bg-warning'}`}
          />
        </div>
        <h3 className="text-sm font-semibold">{pr.title}</h3>
        <p className="text-xs text-muted">Opened by {pr.author}</p>
        <p className="flex-1 text-xs text-muted">{pr.commits.at(-1)?.message ?? 'No commits'}</p>
        <div className="flex items-center gap-1 border-t border-separator pt-2">
          <Button size="sm" variant="primary" className="h-6 rounded-lg text-xs">
            <MessageCircle size={13} /> Send for review
          </Button>
          <Button size="sm" variant="ghost" className="h-6 rounded-lg text-xs">
            Babysitter
          </Button>
          {pr.ciStatus === 'failing' && (
            <Button size="sm" variant="danger-soft" className="h-6 rounded-lg text-xs">
              <Wrench size={13} /> Fix CI
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  )
}
function GitHubSettingsModal({
  isOpen,
  initialTab,
  favoritePeople,
  defaultSlackChannel,
  onClose,
  onSelectPerson
}: {
  isOpen: boolean
  initialTab: 'people' | 'slack'
  favoritePeople: string[]
  defaultSlackChannel?: string
  onClose: () => void
  onSelectPerson?: (person: string) => void
}): React.JSX.Element | null {
  const [tab, setTab] = useState(initialTab)
  const [channel, setChannel] = useState(defaultSlackChannel ?? '')
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card.Header className="flex justify-between">
          <h3>Git workspace settings</h3>
          <Button isIconOnly size="sm" variant="ghost" onPress={onClose}>
            <X size={14} />
          </Button>
        </Card.Header>
        <Card.Content className="space-y-3 p-4">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={tab === 'people' ? 'primary' : 'ghost'}
              onPress={() => setTab('people')}
            >
              People
            </Button>
            <Button
              size="sm"
              variant={tab === 'slack' ? 'primary' : 'ghost'}
              onPress={() => setTab('slack')}
            >
              Slack
            </Button>
          </div>
          {tab === 'people' ? (
            favoritePeople.map((person) => (
              <Button
                key={person}
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                onPress={() => {
                  onSelectPerson?.(person)
                  onClose()
                }}
              >
                {person}
              </Button>
            ))
          ) : (
            <>
              <input
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="#eng-review"
                className="w-full rounded-lg border p-2 text-xs"
              />
              <Button size="sm" onPress={onClose}>
                Save
              </Button>
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
