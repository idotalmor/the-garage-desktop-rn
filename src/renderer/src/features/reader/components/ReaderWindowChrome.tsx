export function ReaderWindowChrome(): React.JSX.Element {
  return (
    <div
      className="window-drag-region fixed inset-x-0 top-0 z-30 flex h-10 items-center bg-background/60 px-4 backdrop-blur-md"
      aria-hidden="true"
    >
      <span className="text-[11px] font-medium text-muted">Reader</span>
    </div>
  )
}
