import { FolderOpen, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { ArtifactoryBoxView } from '../hooks/use-boxes'
import { BoxCard } from './box-card'
import { CreateBoxModal } from './create-box-modal'

type BoxesHomeProps = {
  boxes: ArtifactoryBoxView[]
  filesCount: number
  viewSwitch: ReactNode
  onOpenBox: (name: string) => void
  onOpenExplorer: () => void
  onCreateBox: (input: { name: string; color: string; ticketKey?: string }) => void
}

export function BoxesHome({
  boxes,
  filesCount,
  viewSwitch,
  onOpenBox,
  onOpenExplorer,
  onCreateBox
}: BoxesHomeProps): React.JSX.Element {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1600px] px-8 pb-10 pt-14">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">The Artifactory</h1>
            <p className="mt-1 text-xs text-muted">
              {boxes.length} {boxes.length === 1 ? 'box' : 'boxes'} · {filesCount}{' '}
              {filesCount === 1 ? 'file' : 'files'}
            </p>
          </div>
          {viewSwitch}
        </div>

        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
          {boxes.map((box) => (
            <BoxCard key={box.name} box={box} onOpen={onOpenBox} />
          ))}

          <button
            type="button"
            onClick={onOpenExplorer}
            className="group flex min-h-32 flex-col rounded-2xl border border-border bg-surface-secondary/50 p-4 text-left transition hover:border-foreground/25 hover:bg-surface-secondary"
          >
            <div className="flex items-start gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-muted group-hover:text-foreground">
                <FolderOpen size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">File Explorer</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Browse all {filesCount} {filesCount === 1 ? 'file' : 'files'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              The classic document view — tabs, split view, and tags.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-muted transition hover:border-foreground/30 hover:text-foreground"
          >
            <Plus size={18} aria-hidden="true" />
            <span className="text-xs font-medium">New box</span>
          </button>
        </div>
      </div>

      <CreateBoxModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onConfirm={onCreateBox}
      />
    </div>
  )
}
