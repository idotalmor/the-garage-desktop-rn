import { AlertTriangle, Plus, Trash2, X } from 'lucide-react'
import { Button, Chip, Dropdown } from '@heroui/react'
import type { Source } from '../../../../../shared/local-repos/types'

const folderName = (path: string): string => path.split(/[\\/]/).filter(Boolean).pop() ?? path

/**
 * The folders scanned for repos, as chips (hover for the full path or scan error, × to remove),
 * plus a + that opens the folder picker and a trash menu that resets all local data.
 */
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
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {sources.map((source) => (
        <Chip
          key={source.id}
          size="sm"
          variant="soft"
          color={source.lastError ? 'danger' : 'default'}
          className="gap-1 rounded-md"
        >
          {source.lastError && <AlertTriangle size={11} aria-hidden="true" />}
          <Chip.Label
            title={source.lastError ? `${source.path}\n${source.lastError}` : source.path}
          >
            {folderName(source.path)}
          </Chip.Label>
          <button
            type="button"
            aria-label={`Remove ${source.path}`}
            className="text-muted hover:text-foreground"
            onClick={() => onRemove(source.id)}
          >
            <X size={11} aria-hidden="true" />
          </button>
        </Chip>
      ))}
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
  )
}
