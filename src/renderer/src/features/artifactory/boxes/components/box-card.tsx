import { FileText, Package } from 'lucide-react'
import type { ArtifactoryBoxView } from '../hooks/use-boxes'

const PREVIEW_COUNT = 3

type BoxCardProps = {
  box: ArtifactoryBoxView
  onOpen: (name: string) => void
}

export function BoxCard({ box, onOpen }: BoxCardProps): React.JSX.Element {
  const preview = box.files.slice(0, PREVIEW_COUNT)
  const remaining = box.files.length - preview.length

  return (
    <button
      type="button"
      onClick={() => onOpen(box.name)}
      className="group flex min-h-32 flex-col rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-foreground/25 hover:bg-surface-secondary"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in srgb, ${box.color} 18%, transparent)` }}
        >
          <Package size={17} style={{ color: box.color }} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{box.name}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {box.files.length} {box.files.length === 1 ? 'file' : 'files'}
          </p>
        </div>
        {box.ticketKey && (
          <span className="shrink-0 rounded-md border border-border bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted">
            {box.ticketKey}
          </span>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-1">
        {preview.map((file) => (
          <p key={file.path} className="flex items-center gap-1.5 truncate text-[11px] text-muted">
            <FileText size={11} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{file.name}</span>
          </p>
        ))}
        {remaining > 0 && <p className="text-[11px] text-muted">+{remaining} more</p>}
        {box.files.length === 0 && <p className="text-[11px] text-muted">Empty box</p>}
      </div>
    </button>
  )
}
