import {
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Hash,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Save,
  Tag,
  UploadCloud,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card } from '@heroui/react'
import ReactMarkdown from 'react-markdown'
import { useFiles } from '../hooks/useFiles'
import type { MdFile } from '../types/md-file'
import type { ImportMode } from '../../../../../shared/reader/types'

type FileGroup = {
  name: string
  files: MdFile[]
}

const FILTER_ALL = 'all'
const FILTER_UNTAGGED = 'untagged'

type FilterValue = typeof FILTER_ALL | typeof FILTER_UNTAGGED | string

type GroupBy = 'folder' | 'tag'

const modeOptions: { id: ImportMode; label: string }[] = [
  { id: 'copy', label: 'Copy' },
  { id: 'copy-and-delete', label: 'Copy & delete' },
  { id: 'reference', label: 'Use original' }
]

function getFolderName(path: string): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length < 2) return 'Workspace'
  return parts[parts.length - 2]
}

function fileName(path: string): string {
  return path.split('/').pop() || path
}

function FileGroupSection({
  group,
  active,
  onSelect
}: {
  group: FileGroup
  active: string | null
  onSelect: (path: string) => void
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 px-2 text-[11px] font-medium text-muted">
        <Folder size={13} aria-hidden="true" />
        {group.name}
      </div>
      <div className="space-y-0.5">
        {group.files.map((file) => (
          <Button
            key={file.path}
            fullWidth
            size="sm"
            variant={active === file.path ? 'secondary' : 'ghost'}
            className="justify-start rounded-lg px-2 text-xs"
            onPress={() => onSelect(file.path)}
          >
            <FileText size={14} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">{file.name}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ReaderPage(): React.JSX.Element {
  const { files, active, activeFile, openFile, importFiles, setActive, tags } = useFiles()
  const [isEditing, setIsEditing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [droppedPaths, setDroppedPaths] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('copy')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [newTag, setNewTag] = useState('')
  const [filterTag, setFilterTag] = useState<FilterValue>(FILTER_ALL)
  const [groupBy, setGroupBy] = useState<GroupBy>('folder')

  const filteredFiles = useMemo(() => {
    if (filterTag === FILTER_ALL) return files
    if (filterTag === FILTER_UNTAGGED) return files.filter((file) => file.tags.length === 0)
    return files.filter((file) => file.tags.includes(filterTag))
  }, [files, filterTag])

  const fileGroups = useMemo(() => {
    const groups = new Map<string, MdFile[]>()
    if (groupBy === 'folder') {
      filteredFiles.forEach((file) => {
        const folder = getFolderName(file.path)
        groups.set(folder, [...(groups.get(folder) ?? []), file])
      })
    } else {
      filteredFiles.forEach((file) => {
        if (file.tags.length === 0) {
          groups.set('Untagged', [...(groups.get('Untagged') ?? []), file])
          return
        }
        file.tags.forEach((tag) => groups.set(tag, [...(groups.get(tag) ?? []), file]))
      })
    }
    const sorted = [...groups.keys()].sort((a, b) => {
      if (a === 'Untagged') return 1
      if (b === 'Untagged') return -1
      return a.localeCompare(b)
    })
    return sorted.map((name) => ({ name, files: groups.get(name) ?? [] }))
  }, [filteredFiles, groupBy])

  const content = activeFile ? (drafts[activeFile.path] ?? activeFile.content) : ''

  const handleDrop = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault()
    setIsDragging(false)
    const dataFiles = Array.from(event.dataTransfer.files)
    if (dataFiles.length === 0) return
    const paths = dataFiles
      .map((file) => window.api.getPathForFile(file))
      .filter((path) => path.length > 0)
    if (paths.length === 0) return
    setDroppedPaths(paths)
    setImportMode('copy')
    setSelectedTag('')
    setNewTag('')
    setShowImport(true)
  }

  const submitImport = async (): Promise<void> => {
    await importFiles({
      paths: droppedPaths,
      mode: importMode,
      tag: selectedTag || undefined
    })
    setShowImport(false)
    setDroppedPaths([])
    setNewTag('')
  }

  const addNewTag = (): void => {
    const trimmed = newTag.trim()
    if (!trimmed) return
    setSelectedTag(trimmed)
    setNewTag('')
  }

  return (
    <main
      className="mx-auto flex h-screen w-full max-w-[1600px] flex-col px-4 pb-4 pt-10 sm:px-6 lg:px-8"
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden border-y border-separator">
        <aside
          className={`flex shrink-0 flex-col border-r border-separator py-3 transition-[width,padding] duration-200 ${isSidebarOpen ? 'w-60 pr-3' : 'w-12 pr-0'}`}
          aria-label="Markdown files"
        >
          <div
            className={`flex items-center px-2 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}
          >
            {isSidebarOpen && (
              <div>
                <p className="text-xs font-semibold">Files</p>
                <p className="mt-0.5 text-[11px] text-muted">{files.length} opened</p>
              </div>
            )}
            <div className="flex items-center gap-1">
              {isSidebarOpen && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="size-6 rounded-lg text-muted"
                  aria-label="Open Markdown file"
                  onPress={openFile}
                >
                  <FolderOpen size={14} aria-hidden="true" />
                </Button>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="size-6 rounded-lg text-muted"
                aria-label={isSidebarOpen ? 'Collapse files sidebar' : 'Expand files sidebar'}
                onPress={() => setIsSidebarOpen((open) => !open)}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose size={14} aria-hidden="true" />
                ) : (
                  <PanelLeftOpen size={14} aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {isSidebarOpen && (
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-1 px-2">
                  <Hash size={12} className="text-muted" aria-hidden="true" />
                  <span className="text-[11px] font-medium text-muted">Group by</span>
                </div>
                <div className="flex gap-1 px-2">
                  <Button
                    size="sm"
                    variant={groupBy === 'folder' ? 'secondary' : 'ghost'}
                    className="h-6 rounded-md px-2 text-[11px]"
                    onPress={() => setGroupBy('folder')}
                  >
                    Folder
                  </Button>
                  <Button
                    size="sm"
                    variant={groupBy === 'tag' ? 'secondary' : 'ghost'}
                    className="h-6 rounded-md px-2 text-[11px]"
                    onPress={() => setGroupBy('tag')}
                  >
                    Tag
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1 px-2 pt-1">
                  <Button
                    size="sm"
                    variant={filterTag === FILTER_ALL ? 'secondary' : 'ghost'}
                    className="h-6 rounded-full px-2.5 text-[11px]"
                    onPress={() => setFilterTag(FILTER_ALL)}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={filterTag === FILTER_UNTAGGED ? 'secondary' : 'ghost'}
                    className="h-6 rounded-full px-2.5 text-[11px]"
                    onPress={() => setFilterTag(FILTER_UNTAGGED)}
                  >
                    Untagged
                  </Button>
                  {tags.map((tag) => (
                    <Button
                      key={tag}
                      size="sm"
                      variant={filterTag === tag ? 'secondary' : 'ghost'}
                      className="h-6 rounded-full px-2.5 text-[11px]"
                      onPress={() => setFilterTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {isDragging && (
                <div className="m-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/5 py-6 text-center">
                  <UploadCloud size={24} className="text-accent" aria-hidden="true" />
                  <p className="mt-2 text-xs font-medium text-accent">Drop files to import</p>
                </div>
              )}

              {fileGroups.length > 0 ? (
                <div className="space-y-4">
                  {fileGroups.map((group) => (
                    <FileGroupSection
                      key={group.name}
                      group={group}
                      active={active}
                      onSelect={setActive}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center">
                  <FileText size={20} className="text-muted" aria-hidden="true" />
                  <p className="mt-2 text-xs text-muted">No Markdown files opened yet.</p>
                </div>
              )}
            </div>
          )}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col" aria-label="Markdown preview">
          <header className="flex min-h-12 items-center justify-between gap-3 border-b border-separator px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{activeFile?.name ?? 'Preview'}</p>
              {activeFile && <p className="truncate text-[11px] text-muted">{activeFile.path}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant={!isEditing ? 'secondary' : 'ghost'}
                className="rounded-lg text-xs"
                onPress={() => setIsEditing(false)}
              >
                <Eye size={14} aria-hidden="true" />
                Preview
              </Button>
              <Button
                size="sm"
                variant={isEditing ? 'secondary' : 'ghost'}
                className="rounded-lg text-xs"
                onPress={() => setIsEditing(true)}
              >
                <Pencil size={14} aria-hidden="true" />
                Edit
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-lg text-xs"
                  onPress={() => {}}
                >
                  <Save size={14} aria-hidden="true" />
                  Save
                </Button>
              )}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            {activeFile ? (
              isEditing ? (
                <textarea
                  value={content}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [activeFile.path]: event.target.value }))
                  }
                  aria-label={`Edit ${activeFile.name}`}
                  className="min-h-[26rem] w-full resize-none bg-transparent font-mono text-sm leading-6 text-foreground outline-none"
                />
              ) : (
                <article className="prose max-w-3xl">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </article>
              )
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <FileText size={24} className="text-muted" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Nothing to preview</p>
                <p className="mt-1 text-xs text-muted">Choose a Markdown file from the sidebar.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowImport(false)}
          role="dialog"
          aria-modal="true"
        >
          <Card
            className="w-full max-w-md border border-border bg-surface p-0"
            onClick={(event) => event.stopPropagation()}
          >
            <Card.Header className="flex items-center justify-between border-b border-separator px-4 py-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-accent" aria-hidden="true" />
                <h3 className="text-sm font-semibold">Import files</h3>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="size-6 rounded-full"
                onPress={() => setShowImport(false)}
                aria-label="Close"
              >
                <X size={14} aria-hidden="true" />
              </Button>
            </Card.Header>
            <Card.Content className="space-y-4 p-4">
              <div>
                <p className="mb-2 text-[11px] font-medium text-muted uppercase tracking-wide">
                  Dropped files
                </p>
                <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-2 text-xs">
                  {droppedPaths.map((path) => (
                    <li key={path} className="flex items-center gap-1.5 text-muted">
                      <FileText size={12} aria-hidden="true" />
                      <span className="truncate">{fileName(path)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium text-muted uppercase tracking-wide">
                  Import action
                </p>
                <div className="flex gap-1">
                  {modeOptions.map(({ id, label }) => (
                    <Button
                      key={id}
                      size="sm"
                      fullWidth
                      variant={importMode === id ? 'secondary' : 'ghost'}
                      className="rounded-md text-[11px]"
                      onPress={() => setImportMode(id)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium text-muted uppercase tracking-wide">
                  Tag
                </p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant={selectedTag === '' ? 'secondary' : 'ghost'}
                    className="h-6 rounded-full px-2.5 text-[11px]"
                    onPress={() => setSelectedTag('')}
                  >
                    No tag
                  </Button>
                  {tags.map((tag) => (
                    <Button
                      key={tag}
                      size="sm"
                      variant={selectedTag === tag ? 'secondary' : 'ghost'}
                      className="h-6 rounded-full px-2.5 text-[11px]"
                      onPress={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(event) => setNewTag(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && addNewTag()}
                    placeholder="Create a new tag..."
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted"
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="rounded-lg"
                    onPress={addNewTag}
                    aria-label="Add new tag"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </Button>
                </div>
                {selectedTag && (
                  <p className="mt-2 text-[11px] text-muted">
                    Selected tag: <span className="text-foreground">{selectedTag}</span>
                  </p>
                )}
              </div>
            </Card.Content>
            <Card.Footer className="flex justify-end gap-2 border-t border-separator px-4 py-3">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg text-xs"
                onPress={() => setShowImport(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="rounded-lg text-xs"
                onPress={submitImport}
              >
                Import
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}
    </main>
  )
}
