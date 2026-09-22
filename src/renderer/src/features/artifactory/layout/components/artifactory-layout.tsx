type ArtifactoryLayoutProps = {
  children: React.ReactNode
  onDragOver: (event: React.DragEvent<HTMLElement>) => void
  onDragLeave: () => void
  onDrop: (event: React.DragEvent<HTMLElement>) => void
}

export function ArtifactoryLayout({
  children,
  onDragOver,
  onDragLeave,
  onDrop
}: ArtifactoryLayoutProps): React.JSX.Element {
  return (
    <main
      className="mx-auto flex h-screen w-full max-w-[1600px] flex-col px-1 pb-4 pt-10"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </main>
  )
}
