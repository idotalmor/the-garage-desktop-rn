import {
  Bell,
  Check,
  ChevronDown,
  CircleDot,
  GitBranch,
  GitPullRequest,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Terminal,
  Wrench
} from 'lucide-react'
import { Button, Card } from '@heroui/react'
import { PageHeader } from '../../../shared/components/PageHeader'

type StatusChipProps = {
  tone: 'success' | 'danger' | 'neutral'
  label: string
}

function StatusChip({ tone, label }: StatusChipProps): React.JSX.Element {
  const toneClass = {
    success: 'border border-success/45 bg-success/10 text-success',
    danger: 'border border-danger/45 bg-danger/10 text-danger',
    neutral: 'border border-border bg-surface-secondary text-muted'
  }[tone]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] px-1 py-px text-[9px] leading-3 font-medium ${toneClass}`}
    >
      <span
        className={`size-1.5 rounded-sm ${tone === 'success' ? 'bg-success' : tone === 'danger' ? 'bg-danger' : 'bg-muted'}`}
      />
      {label}
    </span>
  )
}

function GitHubIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function SlackIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="#36c5f0"
        d="M6.5 2A2.5 2.5 0 1 0 6.5 7H9V4.5A2.5 2.5 0 0 0 6.5 2ZM2 6.5A2.5 2.5 0 1 0 7 6.5V9H4.5A2.5 2.5 0 0 0 2 6.5Z"
      />
      <path
        fill="#2eb67d"
        d="M17.5 2A2.5 2.5 0 1 0 17.5 7H15V4.5A2.5 2.5 0 0 1 17.5 2ZM22 6.5A2.5 2.5 0 1 0 17 6.5V9H19.5A2.5 2.5 0 0 0 22 6.5Z"
      />
      <path
        fill="#ecb22e"
        d="M17.5 22A2.5 2.5 0 1 1 17.5 17H15V19.5A2.5 2.5 0 0 1 17.5 22ZM22 17.5A2.5 2.5 0 1 1 17 17.5V15H19.5A2.5 2.5 0 0 1 22 17.5Z"
      />
      <path
        fill="#e01e5a"
        d="M6.5 22A2.5 2.5 0 1 1 6.5 17H9V19.5A2.5 2.5 0 0 1 6.5 22ZM2 17.5A2.5 2.5 0 1 1 7 17.5V15H4.5A2.5 2.5 0 0 1 2 17.5Z"
      />
    </svg>
  )
}

const repositories = [
  {
    name: 'platform-api',
    detail: 'acme/platform-api',
    color: 'bg-violet-400',
    prs: [
      {
        number: 184,
        title: 'Streamline deployment health checks',
        author: 'Maya Chen',
        time: '18 min ago',
        ci: 'Passing',
        comments: 2
      },
      {
        number: 181,
        title: 'Add retry policy to webhook delivery',
        author: 'Noah Williams',
        time: '2h ago',
        ci: 'Failing',
        comments: 0
      },
      {
        number: 176,
        title: 'Update runtime configuration defaults',
        author: 'You',
        time: 'Yesterday',
        ci: 'Passing',
        comments: 4
      }
    ]
  },
  {
    name: 'web-console',
    detail: 'acme/web-console',
    color: 'bg-cyan-400',
    prs: [
      {
        number: 92,
        title: 'New incident timeline filters',
        author: 'Ava Patel',
        time: '42 min ago',
        ci: 'Passing',
        comments: 1
      },
      {
        number: 88,
        title: 'Improve empty state for on-call',
        author: 'You',
        time: '3h ago',
        ci: 'Passing',
        comments: 0
      }
    ]
  }
]

function ReviewCard({
  pr
}: {
  pr: (typeof repositories)[number]['prs'][number]
}): React.JSX.Element {
  return (
    <Card className="h-full min-w-0 rounded-lg">
      <Card.Content className="flex min-h-[132px] flex-col gap-1.5 p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
            <GitPullRequest size={13} className="text-accent" aria-hidden="true" />
            <span>#{pr.number}</span>
            <span>·</span>
            <span>{pr.time}</span>
          </div>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label={`More actions for PR ${pr.number}`}
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </Button>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-4">{pr.title}</h3>
          <p className="mt-1 text-xs text-muted">Opened by {pr.author}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusChip tone={pr.ci === 'Passing' ? 'success' : 'danger'} label={`CI ${pr.ci}`} />
          {pr.comments > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-warning/45 bg-warning/10 px-1 py-px text-[9px] leading-3 font-medium text-warning">
              <MessageCircle size={12} aria-hidden="true" />
              {pr.comments} comments
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 border-t border-separator pt-2">
          <Button
            size="sm"
            variant="primary"
            className="h-6 min-h-6 w-fit min-w-0 rounded-lg px-2 text-[10px] bg-[#4a154b] text-white hover:bg-[#611f69]"
            onPress={() => {}}
          >
            <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
              <SlackIcon />
            </span>
            Send for review
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-6 rounded-lg text-muted"
            aria-label={`Open PR ${pr.number} on GitHub`}
          >
            <GitHubIcon />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-6 rounded-lg text-muted"
            aria-label={`Open PR ${pr.number} in Cursor`}
          >
            <Sparkles size={14} aria-hidden="true" />
          </Button>
        </div>
      </Card.Content>
    </Card>
  )
}

function RepositorySection({
  repository
}: {
  repository: (typeof repositories)[number]
}): React.JSX.Element {
  return (
    <section aria-labelledby={`${repository.name}-heading`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${repository.color}`} />
          <div>
            <div className="flex items-center gap-2">
              <h2 id={`${repository.name}-heading`} className="text-sm font-semibold">
                {repository.name}
              </h2>
              <span className="rounded-[4px] border border-border bg-surface-secondary px-1 py-px text-[9px] text-muted">
                {repository.prs.length} open
              </span>
            </div>
            <p className="text-[11px] text-muted">{repository.detail}</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => {}}>
          <Settings2 size={15} aria-hidden="true" />
          Review settings
        </Button>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="h-full rounded-lg border-dashed bg-surface-secondary/55">
          <Card.Content className="flex h-full min-h-[132px] flex-col justify-between p-2">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <GitBranch size={16} className="text-muted" aria-hidden="true" />
                  master
                </div>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={`Master actions for ${repository.name}`}
                >
                  <MoreHorizontal size={16} aria-hidden="true" />
                </Button>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-muted">
                Operations and fix flows for the default branch.
              </p>
            </div>
            <div className="space-y-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-6 min-h-6 w-fit rounded-lg px-2 text-[10px]"
                onPress={() => {}}
              >
                <Wrench size={14} aria-hidden="true" />
                Fix failing CI
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 min-h-6 w-fit rounded-lg px-2 text-[10px]"
                onPress={() => {}}
              >
                <Terminal size={14} aria-hidden="true" />
                Add action
                <Plus size={13} aria-hidden="true" />
              </Button>
            </div>
          </Card.Content>
        </Card>
        {repository.prs.map((pr) => (
          <ReviewCard key={pr.number} pr={pr} />
        ))}
      </div>
    </section>
  )
}

export function GitHubPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-6 pt-14 sm:px-5 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow={
            <span className="flex items-center gap-1">
              <CircleDot size={12} aria-hidden="true" />
              Git workspace
            </span>
          }
          title="Review queue"
          description="Pull requests, CI signals, and lightweight review workflows — grouped by repository."
        />
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <div
            className="flex h-7 w-[180px] items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-2 text-xs text-muted"
            role="search"
            aria-label="Search pull requests"
          >
            <Search size={13} aria-hidden="true" />
            <span>Search pull requests</span>
          </div>
          <Button size="sm" variant="outline" className="rounded-lg" onPress={() => {}}>
            <GitBranch size={15} aria-hidden="true" />
            Connect to Git
          </Button>
          <Button isIconOnly variant="outline" size="sm" aria-label="Git workspace notifications">
            <Bell size={16} aria-hidden="true" />
          </Button>
        </div>
      </header>

      <section className="mt-4 flex flex-wrap gap-1.5" aria-label="Pull request overview">
        {[
          ['7', 'Open pull requests', 'Across 2 repositories'],
          ['2', 'Need your attention', 'Comments or failing CI'],
          ['4', 'Ready for review', 'No blocking signals']
        ].map(([value, label, detail]) => (
          <Card key={label} className="w-fit min-w-[132px] rounded-lg">
            <Card.Content className="flex items-center justify-between gap-2 p-2.5">
              <div>
                <p className="text-[11px] text-muted">{label}</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
                <p className="mt-0.5 text-[11px] text-muted">{detail}</p>
              </div>
              <Check size={18} className="text-success" aria-hidden="true" />
            </Card.Content>
          </Card>
        ))}
      </section>

      <div className="mt-5 flex justify-end">
        <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => {}}>
          All statuses
          <ChevronDown size={14} aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-6 space-y-7">
        {repositories.map((repository) => (
          <RepositorySection key={repository.name} repository={repository} />
        ))}
      </div>
    </main>
  )
}
