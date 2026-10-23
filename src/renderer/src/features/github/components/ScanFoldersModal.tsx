import { AlertTriangle, FolderPlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@heroui/react'
import type { WorktreesSnapshot } from '../../../../../shared/worktrees/types'
import { Modal } from './Modal'

function relativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

export function ScanFoldersModal({
  snapshot,
  onAdd,
  onRemove,
  onRescan,
  onClose
}: {
  snapshot: WorktreesSnapshot | null
  onAdd: () => void
  onRemove: (id: string) => void
  onRescan: (rootId?: string) => void
  onClose: () => void
}): React.JSX.Element {
  const roots = snapshot?.roots ?? []
  const repositories = snapshot?.repositories ?? []
  const scanning = Boolean(snapshot?.scanning)

  return (
    <Modal title="Scan folders" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-muted">
          Pick a repository, a worktree, or a parent folder like <code>~/code</code>. Folders are
          scanned up to 4 levels deep for git repositories and their worktrees. Results stay on this
          machine.
        </p>

        {roots.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
            No folders yet.
          </p>
        ) : (
          <ul className="divide-y divide-separator rounded-lg border border-border">
            {roots.map((root) => {
              const repoCount = repositories.filter((repo) => repo.rootIds.includes(root.id)).length
              return (
                <li key={root.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" title={root.path}>
                      {root.path}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-muted">
                      {root.lastError ? (
                        <span className="flex items-center gap-1 text-danger">
                          <AlertTriangle size={11} aria-hidden="true" /> {root.lastError}
                        </span>
                      ) : root.lastScannedAt ? (
                        <>
                          {repoCount} {repoCount === 1 ? 'repository' : 'repositories'} · scanned{' '}
                          {relativeTime(root.lastScannedAt)}
                        </>
                      ) : (
                        'Waiting to scan…'
                      )}
                    </p>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="size-7 min-h-7 text-muted hover:text-foreground"
                    isDisabled={scanning}
                    onPress={() => onRescan(root.id)}
                    aria-label={`Rescan ${root.path}`}
                  >
                    <RefreshCw size={13} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="size-7 min-h-7 text-muted hover:text-danger"
                    onPress={() => onRemove(root.id)}
                    aria-label={`Remove ${root.path}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex items-center gap-2">
          {scanning && (
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
              <Loader2 size={12} className="shrink-0 animate-spin" aria-hidden="true" />
              <span className="truncate">
                Scanning
                {snapshot?.progress
                  ? ` · ${snapshot.progress.dirsVisited} folders · ${snapshot.progress.reposFound} repos`
                  : '…'}
              </span>
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto rounded-lg text-xs"
            isDisabled={scanning || roots.length === 0}
            onPress={() => onRescan()}
          >
            <RefreshCw size={13} /> Rescan all
          </Button>
          <Button size="sm" variant="primary" className="rounded-lg text-xs" onPress={onAdd}>
            <FolderPlus size={13} /> Add folders
          </Button>
        </div>
      </div>
    </Modal>
  )
}
