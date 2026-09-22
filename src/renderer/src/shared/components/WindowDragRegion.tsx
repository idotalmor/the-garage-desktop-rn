import type { ReactNode } from 'react'

type WindowDragRegionProps = {
  children?: ReactNode
  className?: string
}

export function WindowDragRegion({
  children,
  className = ''
}: WindowDragRegionProps): React.JSX.Element {
  return (
    <div
      className={['window-drag-region', className].filter(Boolean).join(' ')}
      aria-hidden={!children}
    >
      {children}
    </div>
  )
}
