import { FileText, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@heroui/react'
import { Modal } from './Modal'
import type { Repository, Worktree } from './types'

export function CreatePrModal({
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
