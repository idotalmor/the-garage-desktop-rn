/**
 * The folders scanned for repos, as chips. Only as many as fit on one row are shown; the rest
 * collapse into a "+N" badge like the focus timers in the appbar. Clicking the chips opens a
 * popup listing every source with a remove button and an "Add folders" action. The trailing +
 * opens the folder picker and the trash menu resets all local data.
 */
import { AlertTriangle, Folder, FolderPlus, Plus, Trash2, X } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Button, Chip, Dropdown, Popover } from '@heroui/react'
import type { Source } from '../../../../../shared/local-repos/types'

const folderName = (path: string): string => path.split(/[\\/]/).filter(Boolean).pop() ?? path

const GAP_PX = 4 // gap-1 between chips and between the chip group and the action buttons

function SourceChip({ source }: { source: Source }): React.JSX.Element {
  return (
    <Chip
      size="sm"
      variant="soft"
      color={source.lastError ? 'danger' : 'default'}
      className="shrink-0 gap-1 rounded-md"
    >
      {source.lastError && <AlertTriangle size={11} aria-hidden="true" />}
      <Chip.Label title={source.lastError ? `${source.path}\n${source.lastError}` : source.path}>
        {folderName(source.path)}
      </Chip.Label>
    </Chip>
  )
}

export function SourceChips({
  sources,
  onAdd,
  onRemove,
  onReset
}: {
  sources: Source[]
  onAdd: () => void
  onRemove: (id: string) => void
  onReset: () => void
}): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(sources.length)
  const [listOpen, setListOpen] = useState(false)

  // Measure the hidden full chip row and keep only as many as fit (leaving room for "+N").
  useLayoutEffect(() => {
    const root = rootRef.current
    const measurer = measureRef.current
    if (!root || !measurer) return
    const update = (): void => {
      const widths = Array.from(measurer.querySelectorAll<HTMLElement>('[data-chip]')).map(
        (chip) => chip.offsetWidth
      )
      const badgeWidth = measurer.querySelector<HTMLElement>('[data-badge]')?.offsetWidth ?? 0
      const actionsWidth = actionsRef.current?.offsetWidth ?? 0
      const budget = root.clientWidth - actionsWidth - GAP_PX
      const total =
        widths.reduce((sum, width) => sum + width, 0) + GAP_PX * Math.max(0, widths.length - 1)
      if (total <= budget) {
        setFit(widths.length)
        return
      }
      let used = 0
      let count = 0
      const inner = budget - badgeWidth - GAP_PX
      for (const width of widths) {
        const next = used + (count > 0 ? GAP_PX : 0) + width
        if (next > inner) break
        used = next
        count++
      }
      setFit(count)
    }
    const observer = new ResizeObserver(update)
    observer.observe(root)
    update()
    return () => observer.disconnect()
  }, [sources])

  const hiddenCount = sources.length - fit
  const badgeClass = 'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums'

  return (
    <div
      ref={rootRef}
      className="relative flex min-w-0 items-center justify-end gap-1 overflow-hidden"
    >
      {/* Full set of chips, rendered invisibly so `fit` can be measured against the row width. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 flex gap-1 opacity-0"
      >
        {sources.map((source) => (
          <span key={source.id} data-chip>
            <SourceChip source={source} />
          </span>
        ))}
        <span data-badge className={`${badgeClass} invisible`}>
          +{sources.length}
        </span>
      </div>
      {sources.length > 0 && (
        <Popover onOpenChange={setListOpen}>
          <Popover.Trigger
            className="flex min-w-0 cursor-pointer items-center gap-1"
            aria-label="Scanned folders"
          >
            {sources.slice(0, fit).map((source) => (
              <SourceChip key={source.id} source={source} />
            ))}
            {hiddenCount > 0 && (
              <span className={`${badgeClass} ${listOpen ? 'bg-black text-white' : 'text-muted'}`}>
                +{hiddenCount}
              </span>
            )}
          </Popover.Trigger>
          <Popover.Content placement="bottom end">
            <Popover.Dialog className="w-72 p-1">
              <div role="menu" aria-label="Scanned folders">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-secondary"
                  >
                    <Folder size={13} className="shrink-0 text-muted" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs" title={source.path}>
                        {source.path}
                      </p>
                      {source.lastError && (
                        <p className="truncate text-[10px] text-danger" title={source.lastError}>
                          {source.lastError}
                        </p>
                      )}
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      className="size-5! min-h-5! shrink-0 text-muted hover:text-danger"
                      aria-label={`Remove ${source.path}`}
                      onPress={() => onRemove(source.id)}
                    >
                      <X size={12} aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                <div className="mx-2 my-1 h-px bg-separator" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-surface-secondary"
                  onClick={onAdd}
                >
                  <FolderPlus size={13} className="text-muted" aria-hidden="true" />
                  Add folders…
                </button>
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      )}
      <div ref={actionsRef} className="flex shrink-0 items-center gap-1">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="size-7 min-h-7 text-muted hover:text-foreground"
          aria-label="Add folders"
          onPress={onAdd}
        >
          <Plus size={14} />
        </Button>
        {sources.length > 0 && (
          <Dropdown>
            <Dropdown.Trigger
              aria-label="Reset local data"
              className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary hover:text-danger"
            >
              <Trash2 size={13} aria-hidden="true" />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu aria-label="Reset local data" onAction={onReset}>
                <Dropdown.Item id="reset" className="text-xs text-danger">
                  Delete all folders, repos and worktrees on this machine
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        )}
      </div>
    </div>
  )
}
