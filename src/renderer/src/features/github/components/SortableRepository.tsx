import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

/**
 * One draggable repo group. `children` gets the drag handle for the title's right end — render it
 * only in manual sort mode. Drag it, or focus it and press Space then the arrow keys.
 */
export function SortableRepository({
  id,
  label,
  children
}: {
  id: string
  label: string
  children: (handle: React.ReactNode) => React.ReactNode
}): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label={`Reorder ${label}`}
      className="absolute right-0 top-1/2 flex size-6 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded text-muted transition-colors hover:text-foreground active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={15} aria-hidden="true" />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`space-y-2 ${isDragging ? 'relative z-10 rounded-xl bg-background/80 opacity-90 shadow-lg' : ''}`}
    >
      {children(handle)}
    </div>
  )
}
