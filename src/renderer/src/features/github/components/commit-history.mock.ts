/**
 * Mock commit list from before the modal read real git history. Not imported anymore; kept for
 * offline UI work (see AGENTS.md: keep mock fixtures when switching to live data).
 */
import type { Commit } from './types'

type MockCommit = Commit & { author: string; time: string }

export const mockCommits: MockCommit[] = [
  {
    hash: 'a1b2c3d',
    message: 'Add health check endpoint',
    ciStatus: 'passing',
    author: 'Maya Chen',
    time: '18 min ago'
  },
  {
    hash: 'e4f5g6h',
    message: 'Wire readiness probe to deploy pipeline',
    ciStatus: 'passing',
    author: 'Maya Chen',
    time: '1h ago'
  },
  {
    hash: 'i7j8k9l',
    message: 'Fix flaky timeout in staging deploys',
    ciStatus: 'failing',
    author: 'Noah Williams',
    time: '3h ago'
  },
  {
    hash: 'm1n2o3p',
    message: 'Add retry config for webhook delivery',
    ciStatus: 'in-progress',
    author: 'Noah Williams',
    time: '5h ago'
  },
  {
    hash: 'q4r5s6t',
    message: 'Bump runtime to v2.4',
    ciStatus: 'passing',
    author: 'Ava Patel',
    time: 'Yesterday'
  },
  {
    hash: 'u7v8w9x',
    message: 'Tweak configuration defaults',
    ciStatus: 'passing',
    author: 'You',
    time: '2 days ago'
  }
]
