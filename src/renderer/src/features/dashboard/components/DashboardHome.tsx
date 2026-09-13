import {
  ArrowUp,
  ArrowUpRight,
  Bot,
  Brain,
  CheckCircle2,
  GitPullRequest,
  Sparkles,
  StickyNote
} from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '@heroui/react'
import { PromptInput } from '@heroui-pro/react'

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
        aria-labelledby="orchestrator-title"
      >
        <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Brain size={22} aria-hidden="true" />
        </div>
        <h1
          id="orchestrator-title"
          className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          The Orchestrator
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
                aria-label="Ask The Orchestrator"
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
