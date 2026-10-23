import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

/**
 * One draggable repo group. `children` gets the drag handle to place in the title: it shows on
 * title hover (or keyboard focus); drag it, or focus it and press Space then the arrow keys.
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
      className="-ml-1 flex size-5 cursor-grab touch-none items-center justify-center rounded text-muted opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 active:cursor-grabbing group-hover/title:opacity-100"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={13} aria-hidden="true" />
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
