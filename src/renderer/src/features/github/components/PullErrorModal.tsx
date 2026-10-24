/**
 * Shown when pulling a checkout fails (the ↓N chip): a plain next step when we recognise the error
 * (e.g. "commit or stash your changes"), git's own output, and a shortcut to a Terminal there.
 */
import { AlertTriangle, Terminal } from 'lucide-react'
import { Button } from '@heroui/react'
import { Modal } from './Modal'
import type { Worktree } from './types'

export function PullErrorModal({
  worktree,
  message,
  hint,
  onOpenTerminal,
  onClose
}: {
  worktree: Worktree
  message: string
  hint: string | null
  onOpenTerminal: (path: string) => void
  onClose: () => void
}): React.JSX.Element {
  return (
    <Modal title={`Couldn’t pull ${worktree.branch}`} onClose={onClose}>
      <div className="space-y-3">
        {hint && (
          <p className="flex items-start gap-1.5 text-xs text-warning">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {hint}
          </p>
        )}
        <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-surface-secondary p-2 font-mono text-[11px] text-muted">
          {message || 'git pull failed without saying why.'}
        </pre>
        <div className="flex justify-end gap-2">
          {worktree.path && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-lg text-xs"
              onPress={() => onOpenTerminal(worktree.path ?? '')}
            >
              <Terminal size={13} /> Open in Terminal
            </Button>
          )}
          <Button size="sm" className="h-7 rounded-lg text-xs" onPress={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  )
}
