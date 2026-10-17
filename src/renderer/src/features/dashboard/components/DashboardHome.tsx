import {
  ArrowUp,
  ArrowUpRight,
  BellRing,
  Bot,
  CheckCircle2,
  CircleAlert,
  Flame,
  GitPullRequest,
  Hash,
  ListChecks,
  MessagesSquare,
  Sparkles,
  StickyNote,
  Warehouse
} from 'lucide-react'
import { useState } from 'react'
import { Avatar, Button, Card, Chip, ProgressBar } from '@heroui/react'
import { PromptInput } from '@heroui-pro/react'
import garageDoorSvg from '../../../assets/garage-door-2.svg?raw'
import floppyDisk1Svg from '../../../assets/floppy-disk-1.svg?raw'
import floppyDisk2Svg from '../../../assets/floppy-disk-2.svg?raw'
import floppyDisk3Svg from '../../../assets/floppy-disk-3.svg?raw'
import garageDoorAltSvg from '../../../assets/garage-door-alt.svg?raw'
import garageDoorAltInvSvg from '../../../assets/garage-door-alt-inverted.svg?raw'

type MetricProps = {
  label: string
  value: string
  detail: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

type SignalTone = 'accent' | 'success' | 'warning' | 'danger'

const toneStyles: Record<SignalTone, string> = {
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger'
}

function Metric({ label, value, detail, icon: Icon }: MetricProps): React.JSX.Element {
  return (
    <Card className="min-w-0">
      <Card.Content className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted">{detail}</p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon size={19} aria-hidden="true" />
        </div>
      </Card.Content>
    </Card>
  )
}

const tasksInFlight: {
  title: string
  scope: string
  progress: number
  next: string
  status: string
  tone: SignalTone
}[] = [
  {
    title: 'Billing retry logic',
    scope: 'payments-service · Due today',
    progress: 68,
    next: 'Wire the idempotency key',
    status: 'On track',
    tone: 'accent'
  },
  {
    title: 'Agent memory rollout',
    scope: 'devflow · Due Fri',
    progress: 34,
    next: 'Backfill the session index',
    status: 'At risk',
    tone: 'warning'
  },
  {
    title: 'Migrate CI to runners v2',
    scope: 'infra · 5 of 9 jobs moved',
    progress: 55,
    next: 'Port the e2e matrix',
    status: 'On track',
    tone: 'accent'
  }
]

const slackSignals = [
  {
    author: 'Maya Chen',
    initials: 'MC',
    channel: 'eng-review',
    time: '9:41 AM',
    text: 'Heads up — the retry backoff in #184 conflicts with the queue drain fix. Worth syncing before you merge.',
    match: 'PR #184',
    why: 'Mentions a PR you own'
  },
  {
    author: 'Dan Ortiz',
    initials: 'DO',
    channel: 'payments',
    time: '8:17 AM',
    text: 'Shipped the idempotent charge endpoint. If your retry work builds on it, the docs are in the runbook.',
    match: 'Billing retry logic',
    why: 'Relates to a task due today'
  },
  {
    author: 'Priya Shah',
    initials: 'PS',
    channel: 'devflow',
    time: 'Yesterday',
    text: 'Session index backfill is heavier than expected on large workspaces — flag it before the rollout.',
    match: 'Agent memory rollout',
    why: 'Explains your at-risk status'
  },
  {
    author: 'Lee Wong',
    initials: 'LW',
    channel: 'infra',
    time: 'Yesterday',
    text: 'runners v2 now supports the e2e matrix natively — migration guide is pinned in this channel.',
    match: 'Migrate CI to runners v2',
    why: 'Unblocks your next step'
  }
]

const attentionItems: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  tone: SignalTone
  title: string
  detail: string
  action: string
}[] = [
  {
    icon: CircleAlert,
    tone: 'danger',
    title: 'CI failing on feat/agent-memory',
    detail: 'e2e matrix · failed 14m ago',
    action: 'Fix CI'
  },
  {
    icon: GitPullRequest,
    tone: 'warning',
    title: 'Review requested on PR #184',
    detail: 'Maya is waiting · 2h',
    action: 'Review'
  },
  {
    icon: CheckCircle2,
    tone: 'success',
    title: 'PR #201 approved',
    detail: 'payments retry · ready to merge',
    action: 'Merge'
  }
]

export function DashboardHome(): React.JSX.Element {
  const [prompt, setPrompt] = useState('')
  const [submittedPrompt, setSubmittedPrompt] = useState('')

  const promptSuggestions = [
    'Summarize what changed across my repos',
    'Find the PRs that need my attention',
    'Draft a release update for the team'
  ]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:pt-16">
      <section
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
        aria-labelledby="garage-title"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Warehouse size={15} aria-hidden={true} />
          </span>
          <span className="text-sm font-semibold">The Garage</span>
        </div>
        <div
          className="mx-auto mt-6 w-44 text-foreground"
          aria-label="The Garage icon"
          dangerouslySetInnerHTML={{ __html: garageDoorSvg }}
        />
        <div className="mt-8 flex items-start justify-center gap-10">
          {[
            { svg: floppyDisk1Svg, label: 'Test 1' },
            { svg: floppyDisk2Svg, label: 'Test 2' },
            { svg: floppyDisk3Svg, label: 'Test 3' },
            { svg: garageDoorAltSvg, label: 'Test 4' },
            { svg: garageDoorAltInvSvg, label: 'Inverted' }
          ].map((candidate) => (
            <div key={candidate.label} className="flex flex-col items-center gap-2">
              <div
                className="w-32 text-foreground"
                aria-label={`${candidate.label} icon candidate`}
                dangerouslySetInnerHTML={{ __html: candidate.svg }}
              />
              <span className="text-xs text-muted">{candidate.label}</span>
            </div>
          ))}
        </div>
        <h1 id="garage-title" className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          The Garage
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          Bring your repos, decisions, and next actions into one calm workspace.
        </p>

        <PromptInput
          value={prompt}
          onValueChange={setPrompt}
          onSubmit={() => {
            if (prompt.trim()) setSubmittedPrompt(prompt.trim())
          }}
          className="mt-8 w-full text-start"
        >
          <PromptInput.Shell className="border border-border shadow-surface">
            <PromptInput.Content>
              <PromptInput.TextArea
                className="min-h-28"
                placeholder="What should we move forward?"
                aria-label="Ask The Garage"
              />
            </PromptInput.Content>
            <PromptInput.Toolbar>
              <PromptInput.ToolbarStart>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Sparkles size={13} aria-hidden="true" />
                  Ask across your workspace
                </span>
              </PromptInput.ToolbarStart>
              <PromptInput.ToolbarEnd>
                <PromptInput.Send isDisabled={!prompt.trim()} aria-label="Send prompt">
                  <ArrowUp size={16} aria-hidden="true" />
                </PromptInput.Send>
              </PromptInput.ToolbarEnd>
            </PromptInput.Toolbar>
          </PromptInput.Shell>
        </PromptInput>

        <div className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Prompt suggestions">
          {promptSuggestions.map((suggestion) => (
            <Button
              key={suggestion}
              size="sm"
              variant="ghost"
              className="rounded-full border border-border text-xs text-muted"
              onPress={() => setPrompt(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        {submittedPrompt && (
          <p className="mt-4 text-xs text-accent" role="status">
            Ready to orchestrate: {submittedPrompt}
          </p>
        )}
      </section>

      <section
        className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Workspace overview"
      >
        <Metric label="Open Tasks" value="12" detail="3 due this week" icon={CheckCircle2} />
        <Metric label="Pull Requests" value="4" detail="2 awaiting review" icon={GitPullRequest} />
        <Metric label="Active Notes" value="8" detail="Keep ideas in motion" icon={StickyNote} />
        <Metric label="Agent Runs" value="6" detail="All systems operational" icon={Bot} />
      </section>

      <section className="mt-10" aria-labelledby="tasks-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="tasks-title"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <ListChecks size={18} aria-hidden="true" className="text-muted" />
              Tasks in flight
            </h2>
            <p className="mt-1 text-sm text-muted">
              How far along each active task is, and what moves it next.
            </p>
          </div>
          <Button size="sm" variant="ghost" className="text-muted" onPress={() => {}}>
            View all tasks <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tasksInFlight.map((task) => (
            <Card key={task.title}>
              <Card.Content className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-muted">{task.scope}</p>
                  </div>
                  <Chip size="sm" variant="soft" color={task.tone} className="shrink-0">
                    {task.status}
                  </Chip>
                </div>
                <ProgressBar
                  value={task.progress}
                  color={task.tone}
                  size="sm"
                  aria-label={`${task.title} progress`}
                >
                  <div className="flex items-center gap-3">
                    <ProgressBar.Track className="min-w-0 flex-1">
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                    <ProgressBar.Output className="shrink-0 text-xs font-medium tabular-nums text-muted" />
                  </div>
                </ProgressBar>
                <p className="mt-auto text-xs text-muted">Next: {task.next}</p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <Card.Header className="p-6 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Card.Title className="flex items-center gap-2">
                  <MessagesSquare size={16} aria-hidden="true" className="text-muted" />
                  Signals from Slack
                </Card.Title>
                <Card.Description>
                  Why this is here: the Garage reads your Slack and surfaces threads that mention
                  your tasks, PRs, or past work — so decisions and blockers find you instead of
                  getting lost in channels.
                </Card.Description>
              </div>
              <Chip size="sm" variant="soft" className="shrink-0">
                Beta
              </Chip>
            </div>
          </Card.Header>
          <Card.Content className="space-y-3 px-6 pb-6">
            {slackSignals.map((signal) => (
              <div
                key={`${signal.author}-${signal.time}`}
                className="flex items-start gap-3 rounded-xl bg-surface-secondary px-3 py-3"
              >
                <Avatar className="size-8 shrink-0">
                  <Avatar.Fallback>{signal.initials}</Avatar.Fallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium">{signal.author}</span>
                    <span className="flex items-center gap-0.5 text-xs text-muted">
                      <Hash size={11} aria-hidden="true" />
                      {signal.channel}
                    </span>
                    <span className="text-xs text-muted">· {signal.time}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{signal.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Chip size="sm" variant="soft" color="accent">
                      {signal.match}
                    </Chip>
                    <span className="text-xs text-muted">{signal.why}</span>
                  </div>
                </div>
              </div>
            ))}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="p-6 pb-4">
            <Card.Title className="flex items-center gap-2">
              <BellRing size={16} aria-hidden="true" className="text-muted" />
              Needs you now
            </Card.Title>
            <Card.Description>The few things only you can unblock.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-2 px-6 pb-6">
            {attentionItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-xl bg-surface-secondary px-3 py-3"
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${toneStyles[item.tone]}`}
                >
                  <item.icon size={15} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted">{item.detail}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 rounded-lg text-xs"
                  onPress={() => {}}
                >
                  {item.action}
                </Button>
              </div>
            ))}
          </Card.Content>
        </Card>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header className="p-6 pb-4">
            <Card.Title className="flex items-center gap-2">
              <Flame size={16} aria-hidden="true" className="text-muted" />
              Protect your focus
            </Card.Title>
            <Card.Description>Turn an open window into progress on a task.</Card.Description>
          </Card.Header>
          <Card.Content className="px-6 pb-6">
            <div className="rounded-2xl bg-surface-secondary p-5">
              <p className="text-sm font-medium">90 unblocked minutes before your next meeting</p>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
                Queue it against &quot;Billing retry logic&quot; — the task that&apos;s due today —
                and let Focus Mode hold the interruptions.
              </p>
              <Button className="mt-5" size="sm" variant="primary" onPress={() => {}}>
                Start a focus session <ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="p-6 pb-4">
            <Card.Title className="flex items-center gap-2">
              <Sparkles size={16} aria-hidden="true" className="text-muted" />
              Standup draft
            </Card.Title>
            <Card.Description>Composed from your merges, tasks, and notes.</Card.Description>
          </Card.Header>
          <Card.Content className="px-6 pb-6">
            <div className="rounded-2xl bg-surface-secondary p-5">
              <p className="text-sm leading-6 text-muted">
                <span className="font-medium text-foreground">Yesterday:</span> merged 2 PRs, closed
                3 tasks. <span className="font-medium text-foreground">Today:</span> finish billing
                retry, review PR #184.{' '}
                <span className="font-medium text-foreground">Blocked by:</span> CI runners v2
                matrix.
              </p>
              <Button className="mt-5" size="sm" variant="outline" onPress={() => {}}>
                Copy draft <ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </Card.Content>
        </Card>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <Card.Header className="p-6">
            <Card.Title>Start where you left off</Card.Title>
            <Card.Description>A focused place for the next useful action.</Card.Description>
          </Card.Header>
          <Card.Content className="px-6 pb-6">
            <div className="rounded-2xl bg-surface-secondary p-5">
              <p className="text-sm font-medium">Build a reliable review habit</p>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
                Review open pull requests, capture follow-ups in Notes, and keep your context close.
              </p>
              <Button className="mt-5" size="sm" variant="primary" onPress={() => {}}>
                View workspace <ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="p-6">
            <Card.Title>Recent activity</Card.Title>
            <Card.Description>Your latest workspace signals.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4 px-6 pb-6">
            {[
              'Note added to Release planning',
              'Agent completed Dependency audit',
              'PR #184 is ready for review'
            ].map((activity) => (
              <div key={activity} className="flex items-center gap-3 text-sm">
                <span className="size-2 rounded-full bg-accent" />
                <span className="text-muted">{activity}</span>
              </div>
            ))}
          </Card.Content>
        </Card>
      </section>
    </main>
  )
}
