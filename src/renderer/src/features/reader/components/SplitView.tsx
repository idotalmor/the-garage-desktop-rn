import { useRef, useState } from 'react'

type SplitViewProps = {
  left: React.ReactNode
  right: React.ReactNode
  onClose: () => void
}

export function SplitView({ left, right, onClose }: SplitViewProps): React.JSX.Element {
  const [ratio, setRatio] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return
    setRatio(Math.min(0.8, Math.max(0.2, (event.clientX - bounds.left) / bounds.width)))
  }

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 overflow-hidden" style={{ flex: `0 0 ${ratio * 100}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-label="Resize split view"
        aria-orientation="vertical"
        className="group relative z-10 w-1 shrink-0 cursor-col-resize bg-separator hover:bg-accent"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onDoubleClick={onClose}
      >
        <span className="absolute inset-y-0 -left-1 -right-1" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  )
}
