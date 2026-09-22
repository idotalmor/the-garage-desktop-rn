import { FileText, Pin, PinOff, X } from 'lucide-react'
import type { ArtifactoryTab as ArtifactoryTabModel } from '../hooks/use-artifactory-tabs'

type ArtifactoryTabProps = {
  tab: ArtifactoryTabModel
  isActive: boolean
  isPinned: boolean
  onSelect: (path: string) => void
  onTogglePin: (path: string) => void
  onClose: (path: string) => void
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>, path: string) => void
}

export function ArtifactoryTab({
  tab,
  isActive,
  isPinned,
  onSelect,
  onTogglePin,
  onClose,
  onContextMenu
}: ArtifactoryTabProps): React.JSX.Element {
  const file = tab.files[0]

  return (
    <div
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      className={`group flex h-7 max-w-[14rem] shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-[11px] transition-colors ${
        isPinned
          ? isActive
            ? 'border-violet-400/60 bg-violet-500/25 text-foreground'
            : 'border-violet-400/40 bg-violet-500/15 text-foreground hover:bg-violet-500/25'
          : isActive
            ? 'border-border bg-surface text-foreground'
            : 'border-transparent text-muted hover:bg-surface hover:text-foreground'
      }`}
      onClick={() => onSelect(file.path)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect(file.path)
      }}
      onContextMenu={(event) => onContextMenu(event, file.path)}
    >
      <FileText size={12} aria-hidden="true" />
      <span className="truncate">
        {tab.isCombined ? tab.files.map((item) => item.name).join(' · ') : file.name}
      </span>
      <button
        type="button"
        className={`rounded p-0.5 hover:text-foreground ${isPinned ? 'text-violet-300 opacity-100' : 'text-muted opacity-0 group-hover:opacity-100'}`}
        onClick={(event) => {
          event.stopPropagation()
          onTogglePin(file.path)
        }}
        aria-label={isPinned ? `Unpin ${file.name}` : `Pin ${file.name}`}
      >
        {isPinned ? <Pin size={12} aria-hidden="true" /> : <PinOff size={12} aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="rounded p-0.5 text-muted opacity-0 hover:text-foreground group-hover:opacity-100"
        onClick={(event) => {
          event.stopPropagation()
          tab.files.forEach((item) => onClose(item.path))
        }}
        aria-label={`Close ${tab.isCombined ? 'split documents' : file.name}`}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  )
}
