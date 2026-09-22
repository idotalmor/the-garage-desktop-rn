import { Maximize2, Pencil, Save, X } from 'lucide-react'
import { Button } from '@heroui/react'
import type { MdFile } from '../../../../../../shared/artifactory/types'
import { MarkdownViewer } from './markdown-viewer'
import { DocumentConnections } from './document-connections'

type ArtifactoryViewerProps = {
  file: MdFile | null
  content: string
  isEditing: boolean
  isStandalone: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onChange: (content: string) => void
  onExpand: () => void
}

export function ArtifactoryViewer({
  file,
  content,
  isEditing,
  isStandalone,
  onEdit,
  onSave,
  onCancel,
  onChange,
  onExpand
}: ArtifactoryViewerProps): React.JSX.Element {
  if (!file) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium">Nothing to preview</p>
        <p className="mt-1 text-xs text-muted">Choose a Markdown file from the sidebar.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-separator px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="truncate text-[11px] text-muted">{file.path}</p>
          <DocumentConnections path={file.path} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isEditing ? (
            <>
              <Button size="sm" variant="primary" className="rounded-lg text-xs" onPress={onSave}>
                <Save size={14} aria-hidden="true" />
                Save
              </Button>
              <Button
                size="sm"
                variant="danger-soft"
                className="rounded-lg text-xs"
                onPress={onCancel}
              >
                <X size={14} aria-hidden="true" />
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" className="rounded-lg text-xs" onPress={onEdit}>
              <Pencil size={14} aria-hidden="true" />
              Edit
            </Button>
          )}
          {!isStandalone && !isEditing && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="rounded-lg"
              onPress={onExpand}
              aria-label="Open artifactory in a new window"
            >
              <Maximize2 size={14} aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>

      {isEditing ? (
        <div className="grid min-h-0 flex-1 grid-cols-2 overflow-hidden">
          <div className="min-h-0 overflow-y-auto border-r border-separator px-4 py-5">
            <MarkdownViewer content={content} />
          </div>
          <div className="min-h-0 flex-1 bg-surface-secondary">
            <textarea
              value={content}
              onChange={(event) => onChange(event.target.value)}
              aria-label={`Edit ${file.name}`}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-foreground outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <MarkdownViewer content={content} />
        </div>
      )}
    </div>
  )
}
