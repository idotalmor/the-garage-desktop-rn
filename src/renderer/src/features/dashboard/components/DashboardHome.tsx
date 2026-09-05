import { ArrowUpRight, Bot, CheckCircle2, GitPullRequest, StickyNote } from 'lucide-react'
import { Button, Card } from '@heroui/react'
import { PageHeader } from '../../../shared/components/PageHeader'

type MetricProps = {
  label: string
  value: string
  detail: string
  icon: React.ComponentType<{ size?: number; className?: string }>
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

export function DashboardHome(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:pt-16">
      <PageHeader
        eyebrow="Saturday, August 29"
        title="Your development cockpit."
        description="Keep your tasks, notes, pull requests, and agent workflows moving from one calm workspace."
      />

      <section
        className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Workspace overview"
      >
        <Metric label="Open Tasks" value="12" detail="3 due this week" icon={CheckCircle2} />
        <Metric label="Pull Requests" value="4" detail="2 awaiting review" icon={GitPullRequest} />
        <Metric label="Active Notes" value="8" detail="Keep ideas in motion" icon={StickyNote} />
        <Metric label="Agent Runs" value="6" detail="All systems operational" icon={Bot} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
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
