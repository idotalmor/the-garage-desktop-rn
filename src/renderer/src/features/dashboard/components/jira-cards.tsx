import { ArrowUpRight } from 'lucide-react'
import { Button } from '@heroui/react'
import type { GitHubCardSpec } from '../../github/components/GitHubCard'

type JiraStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done'

type JiraTicket = {
  key: string
  summary: string
  status: JiraStatus
  priority: 'High' | 'Medium' | 'Low'
  assignee: string
  points: number
}

const jiraTickets: JiraTicket[] = [
  {
    key: 'DEV-192',
    summary: 'Batch review reminders into a single daily digest',
    status: 'In Progress',
    priority: 'High',
    assignee: 'You',
    points: 5
  },
  {
    key: 'OPS-184',
    summary: 'Streamline deployment health checks',
    status: 'In Review',
    priority: 'Medium',
    assignee: 'Maya Chen',
    points: 3
  },
  {
    key: 'OPS-181',
    summary: 'Add retry policy to webhook delivery',
    status: 'To Do',
    priority: 'High',
    assignee: 'Noah Williams',
    points: 8
  },
  {
    key: 'DEV-176',
    summary: 'Update runtime configuration defaults',
    status: 'Done',
    priority: 'Low',
    assignee: 'You',
    points: 2
  }
]

const statusStyle: Record<JiraStatus, string> = {
  'To Do': 'text-muted',
  'In Progress': 'text-accent',
  'In Review': 'text-warning',
  Done: 'text-success'
}

const priorityDot: Record<JiraTicket['priority'], string> = {
  High: 'bg-danger',
  Medium: 'bg-warning',
  Low: 'bg-muted'
}

/** Jira tickets have no git history, so their cards get no commit-history button. */
export function buildJiraCards(): GitHubCardSpec[] {
  return jiraTickets.map((ticket) => ({
    key: `jira-${ticket.key}`,
    title: ticket.summary,
    aside: (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
        <span className={`size-1.5 rounded-full ${priorityDot[ticket.priority]}`} />
        {ticket.key}
      </span>
    ),
    body: (
      <>
        <p className={`line-clamp-2 text-sm font-semibold ${statusStyle[ticket.status]}`}>
          {ticket.status}
        </p>
        <p className="line-clamp-2 text-xs text-muted">
          {ticket.assignee} · {ticket.points} pts · {ticket.priority} priority
        </p>
      </>
    ),
    footer: (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 rounded-lg text-xs"
        onPress={() => window.open('https://jira', '_blank')}
        aria-label={`Open ${ticket.key} in Jira`}
      >
        <ArrowUpRight size={13} /> Open in Jira
      </Button>
    )
  }))
}
