import {
  ChevronLeft,
  FileText,
  FolderOpen,
  Package,
  Plus,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@heroui/react'
import type { MdFile } from '../../../../../../shared/artifactory/types'
import type { ArtifactoryBoxView } from '../hooks/use-boxes'

type BoxDetailProps = {
  box: ArtifactoryBoxView
  candidateFiles: MdFile[]
  viewSwitch: ReactNode
  isDragging: boolean
  onDragOver: (event: React.DragEvent<HTMLElement>) => void
  onDragLeave: () => void
  onDrop: (event: React.DragEvent<HTMLElement>) => void
  onBack: () => void
  onOpenFile: (path: string) => void
  onOpenInExplorer: () => void
  onAddFile: (path: string) => void
  onRemoveFile: (path: string) => void
  onDelete: () => void
}

export function BoxDetail({
  box,
  candidateFiles,
  viewSwitch,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onBack,
  onOpenFile,
  onOpenInExplorer,
  onAddFile,
  onRemoveFile,
  onDelete
}: BoxDetailProps): React.JSX.Element {
  const [isAdding, setIsAdding] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!confirmingDelete) return
    const timer = window.setTimeout(() => setConfirmingDelete(false), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmingDelete])

  return (
    <div
      className="h-full overflow-y-auto"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="mx-auto w-full max-w-[1600px] px-8 pb-10 pt-14">
        <div className="flex items-center justify-between gap-4">
          <Button
            size="sm"
            variant="ghost"
            className="-ml-2 gap-1 rounded-lg px-2 text-xs text-muted"
            onPress={onBack}
          >
            <ChevronLeft size={14} aria-hidden="true" />
            Boxes
          </Button>
          {viewSwitch}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `color-mix(in srgb, ${box.color} 18%, transparent)` }}
            >
              <Package size={20} style={{ color: box.color }} aria-hidden="true" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{box.name}</h1>
                {box.ticketKey && (
                  <span className="rounded-md border border-border bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted">
                    {box.ticketKey}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {box.files.length} {box.files.length === 1 ? 'file' : 'files'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 rounded-lg text-xs"
              onPress={onOpenInExplorer}
            >
              <FolderOpen size={13} aria-hidden="true" />
              Open in explorer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`gap-1.5 rounded-lg text-xs ${confirmingDelete ? 'text-red-400' : 'text-muted'}`}
              onPress={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
            >
              <Trash2 size={13} aria-hidden="true" />
              {confirmingDelete ? 'Confirm delete' : 'Delete box'}
            </Button>
          </div>
        </div>

        {isDragging && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/5 py-6 text-center">
            <UploadCloud size={24} className="text-accent" aria-hidden="true" />
            <p className="mt-2 text-xs font-medium text-accent">
              Drop files to import into this box
            </p>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Files in this box
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 rounded-lg px-2 text-[11px] text-muted"
              onPress={() => setIsAdding((current) => !current)}
              aria-expanded={isAdding}
            >
              <Plus size={12} aria-hidden="true" />
              Add files
            </Button>
          </div>

          {isAdding && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface-secondary/50 p-1.5">
              {candidateFiles.length > 0 ? (
                candidateFiles.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface"
                    onClick={() => onAddFile(file.path)}
                  >
                    <Plus size={12} className="shrink-0 text-muted" aria-hidden="true" />
                    <span className="truncate">{file.name}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-muted">
                      {file.path}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-2.5 py-2 text-[11px] text-muted">
                  Every file is already in this box.
                </p>
              )}
            </div>
          )}

          <div className="mt-2 space-y-0.5">
            {box.files.map((file) => (
              <div
                key={file.path}
                className="group flex items-center gap-1 rounded-lg border border-transparent hover:border-border hover:bg-surface"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
                  onClick={() => onOpenFile(file.path)}
                >
                  <FileText size={14} className="shrink-0 text-muted" aria-hidden="true" />
                  <span className="truncate text-xs font-medium text-foreground">{file.name}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-muted">
                    {file.path}
                  </span>
                  {file.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      {file.tags.map((tag) => (
                        <span
                          key={tag.name}
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="mr-1.5 rounded-md p-1 text-muted opacity-0 transition hover:bg-surface-secondary hover:text-foreground group-hover:opacity-100"
                  aria-label={`Remove ${file.name} from box`}
                  onClick={() => onRemoveFile(file.path)}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            ))}
            {box.files.length === 0 && !isDragging && (
              <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
                <FileText size={18} className="text-muted" aria-hidden="true" />
                <p className="mt-2 text-xs text-muted">
                  No files yet — drag files in or use Add files.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
