import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Mail,
  PenLine,
  Plus,
  Send,
  Sparkles
} from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Chip } from '@heroui/react'
import { PageHeader } from '../../../shared/components/PageHeader'

const issueQueue = [
  { title: 'The weekly build: faster reviews, calmer releases', status: 'Ready', date: 'Today' },
  { title: 'How we make CI failures actionable', status: 'Draft', date: 'Sep 18' },
  { title: 'A field guide to useful agent context', status: 'Idea', date: 'Sep 25' }
]

const signals = [
  { label: 'Open rate', value: '64%', detail: '+8% from last issue' },
  { label: 'Subscribers', value: '1,284', detail: '+42 this month' },
  { label: 'Drafts in queue', value: '3', detail: '1 ready to send' }
]

export function NewsletterPage(): React.JSX.Element {
  const [isDraftCreated, setIsDraftCreated] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow={
            <span className="flex items-center gap-1">
              <Mail size={13} aria-hidden="true" /> Publishing desk
            </span>
          }
          title="Newsletter"
          description="Turn the work happening across your repos into a consistent, thoughtful update for your team."
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onPress={() => setIsPreviewing((open) => !open)}
          >
            <ArrowUpRight size={15} aria-hidden="true" />
            {isPreviewing ? 'Close preview' : 'Preview issue'}
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="rounded-lg"
            onPress={() => setIsDraftCreated(true)}
          >
            <Plus size={15} aria-hidden="true" />
            New issue
          </Button>
        </div>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Newsletter metrics">
        {signals.map((signal) => (
          <Card key={signal.label}>
            <Card.Content className="p-5">
              <p className="text-sm text-muted">{signal.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {signal.value}
              </p>
              <p className="mt-1 text-xs text-muted">{signal.detail}</p>
            </Card.Content>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <Card.Header className="p-6 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Card.Title>Issue queue</Card.Title>
                <Card.Description>Keep the publishing rhythm visible.</Card.Description>
              </div>
              <Chip size="sm" variant="soft" color="success">
                Weekly
              </Chip>
            </div>
          </Card.Header>
          <Card.Content className="space-y-2 px-6 pb-6">
            {issueQueue.map((issue, index) => (
              <div
                key={issue.title}
                className="flex items-center gap-3 rounded-xl bg-surface-secondary px-3 py-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                  {index === 0 ? (
                    <Send size={15} aria-hidden="true" />
                  ) : (
                    <PenLine size={15} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{issue.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <CalendarDays size={12} aria-hidden="true" /> {issue.date}
                  </p>
                </div>
                <Chip
                  size="sm"
                  variant="soft"
                  color={
                    issue.status === 'Ready'
                      ? 'success'
                      : issue.status === 'Draft'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {issue.status}
                </Chip>
              </div>
            ))}
            {isDraftCreated && (
              <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-3 text-sm text-accent">
                <Check size={15} aria-hidden="true" /> New blank issue added to the queue.
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="p-6 pb-4">
            <Card.Title>Next issue</Card.Title>
            <Card.Description>Start from the strongest signals in your workspace.</Card.Description>
          </Card.Header>
          <Card.Content className="px-6 pb-6">
            <div className="rounded-2xl bg-surface-secondary p-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Sparkles size={19} aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm font-medium">Let the Orchestrator find the story</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Summarize merged PRs, notable incidents, and the decisions your team should carry
                into next week.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="mt-5 rounded-lg"
                onPress={() => setIsDraftCreated(true)}
              >
                Build a draft <ArrowUpRight size={15} aria-hidden="true" />
              </Button>
            </div>
          </Card.Content>
        </Card>
      </section>

      {isPreviewing && (
        <Card className="mt-6 border-accent/30">
          <Card.Header className="p-6 pb-3">
            <Card.Title>The weekly build: faster reviews, calmer releases</Card.Title>
            <Card.Description>Preview · Internal audience · Ready to send</Card.Description>
          </Card.Header>
          <Card.Content className="max-w-3xl px-6 pb-6">
            <p className="text-sm leading-7 text-muted">
              A short round-up of the changes that made the platform easier to operate, the PRs
              worth a second look, and the small improvements that compound over time.
            </p>
          </Card.Content>
        </Card>
      )}
    </main>
  )
}
