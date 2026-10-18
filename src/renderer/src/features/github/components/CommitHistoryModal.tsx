import { GitCommit } from 'lucide-react'
import { CiBadge } from './CiBadge'
import { Modal } from './Modal'
import type { Commit } from './types'

type MockCommit = Commit & { author: string; time: string }

// Mock data for UI development — replaced by the branch's real commits once git data is injected.
const mockCommits: MockCommit[] = [
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

export function CommitHistoryModal({
  title,
  hasUncommitted,
  onClose
}: {
  title: string
  hasUncommitted?: boolean
  onClose: () => void
}): React.JSX.Element {
  return (
    <Modal title={`Commit history · ${title}`} onClose={onClose}>
      <ul className="space-y-2">
        {hasUncommitted && (
          <li className="flex items-center gap-2 rounded-lg border border-dashed border-warning/50 bg-warning/10 p-2 text-xs">
            <span className="size-2 shrink-0 rounded-full bg-warning" />
            <GitCommit size={14} className="text-warning" />
            <span className="min-w-0 flex-1 truncate font-medium text-warning">
              Uncommitted changes
            </span>
            <span className="shrink-0 text-[10px] text-muted">Working tree</span>
          </li>
        )}
        {mockCommits.map((commit) => (
          <li
            key={commit.hash}
            className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs"
          >
            <CiBadge status={commit.ciStatus} />
            <GitCommit size={14} className="text-muted" />
            <code>{commit.hash}</code>
            <span className="min-w-0 flex-1 truncate">{commit.message}</span>
            <span className="shrink-0 text-[10px] text-muted">
              {commit.author} · {commit.time}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
