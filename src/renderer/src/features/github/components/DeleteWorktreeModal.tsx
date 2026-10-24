/**
 * Confirmation shown before deleting a checkout: the folder goes to the Trash, with a warning for
 * uncommitted changes. The remote branch option is wired but a no-op until GitHub integration
 * lands. Only shown for linked worktrees — the main checkout can't be deleted.
 */
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@heroui/react'
import { Modal } from './Modal'
import type { Worktree } from './types'

export function DeleteWorktreeModal({
  worktree,
  deleting,
  error,
  onDelete,
  onClose
}: {
  worktree: Worktree
  deleting: boolean
  error?: string | null
  onDelete: (deleteRemote: boolean) => void
  onClose: () => void
}): React.JSX.Element {
  const [deleteRemote, setDeleteRemote] = useState(false)
  const canDeleteRemote = !worktree.isDetached
  return (
    <Modal title="Delete checkout" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs">
          Move <span className="font-semibold">{worktree.name}</span> ({worktree.branch}) to the
          Trash?
        </p>
        {worktree.path && (
          <p className="truncate text-[10px] text-muted" title={worktree.path}>
            {worktree.path}
          </p>
        )}
        {worktree.hasUncommitted && (
          <p className="flex items-start gap-1.5 text-xs text-warning">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            It has uncommitted changes.
          </p>
        )}
        {canDeleteRemote && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={deleteRemote}
              onChange={(event) => setDeleteRemote(event.target.checked)}
              className="size-3.5"
              style={{ accentColor: 'var(--danger)' }}
            />
            Also delete remote branch origin/{worktree.branch}
          </label>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onPress={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="h-7 rounded-lg text-xs"
            isDisabled={deleting}
            onPress={() => onDelete(deleteRemote && canDeleteRemote)}
          >
            <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Move to Trash'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
