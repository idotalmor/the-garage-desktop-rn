import { AlertTriangle, FolderPlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@heroui/react'
import type { LocalReposSnapshot } from '../../../../../shared/local-repos/types'
import { Modal } from './Modal'

function relativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Where repositories come from. Today only folders on this machine (`sources`); a GitHub
 * section will join it once GitHub is connected.
 */
export function SourcesModal({
  snapshot,
  onAdd,
  onRemove,
  onRescan,
  onReset,
  onClose
}: {
  snapshot: LocalReposSnapshot | null
  onAdd: () => void
  onRemove: (id: string) => void
  onRescan: (sourceId?: string) => void
  onReset: () => void
  onClose: () => void
}): React.JSX.Element {
  const sources = snapshot?.sources ?? []
  const repositories = snapshot?.repositories ?? []
  const scanning = Boolean(snapshot?.scanning)
  const [confirmingReset, setConfirmingReset] = useState(false)

  return (
    <Modal title="Sources" onClose={onClose}>
      <section className="space-y-3" aria-labelledby="sources-folders-heading">
        <h3 id="sources-folders-heading" className="text-xs font-semibold">
          Folders on this machine
        </h3>
        <p className="text-xs text-muted">
          Pick a repository, a worktree, or a parent folder like <code>~/code</code>. Folders are
          scanned up to 4 levels deep for git repositories and their worktrees. Results stay on this
          machine.
        </p>

        {sources.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
            No folders yet.
          </p>
        ) : (
          <ul className="divide-y divide-separator rounded-lg border border-border">
            {sources.map((folder) => {
              const repoCount = repositories.filter((repo) =>
                repo.sourceIds.includes(folder.id)
              ).length
              return (
                <li key={folder.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" title={folder.path}>
                      {folder.path}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-muted">
                      {folder.lastError ? (
                        <span className="flex items-center gap-1 text-danger">
                          <AlertTriangle size={11} aria-hidden="true" /> {folder.lastError}
                        </span>
                      ) : folder.lastScannedAt ? (
                        <>
                          {repoCount} {repoCount === 1 ? 'repository' : 'repositories'} · scanned{' '}
                          {relativeTime(folder.lastScannedAt)}
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
                    onPress={() => onRescan(folder.id)}
                    aria-label={`Rescan ${folder.path}`}
                  >
                    <RefreshCw size={13} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="size-7 min-h-7 text-muted hover:text-danger"
                    onPress={() => onRemove(folder.id)}
                    aria-label={`Remove ${folder.path}`}
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
            isDisabled={scanning || sources.length === 0}
            onPress={() => onRescan()}
          >
            <RefreshCw size={13} /> Rescan all
          </Button>
          <Button size="sm" variant="primary" className="rounded-lg text-xs" onPress={onAdd}>
            <FolderPlus size={13} /> Add folders
          </Button>
        </div>
      </section>

      <div className="mt-5 flex items-center gap-2 border-t border-separator pt-3">
        {confirmingReset ? (
          <>
            <span className="text-[11px] text-danger">
              Delete all folders, repositories and worktrees saved on this machine?
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto rounded-lg text-xs"
              onPress={() => setConfirmingReset(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="rounded-lg text-xs"
              onPress={() => {
                setConfirmingReset(false)
                onReset()
              }}
            >
              <Trash2 size={13} /> Reset
            </Button>
          </>
        ) : (
          <>
            <span className="text-[11px] text-muted">Start over with an empty local database.</span>
            <Button
              size="sm"
              variant="danger-soft"
              className="ml-auto rounded-lg text-xs"
              onPress={() => setConfirmingReset(true)}
            >
              Reset local data
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
