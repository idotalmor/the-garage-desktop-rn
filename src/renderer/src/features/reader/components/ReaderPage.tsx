import {
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Hash,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Save,
  UploadCloud
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@heroui/react'
import { useFiles } from '../hooks/useFiles'
import type { MdFile, Tag } from '../../../../../shared/reader/types'
import { ImportFilesModal } from './ImportFilesModal'
import { MarkdownPreview } from './MarkdownPreview'

type FileGroup = {
  name: string
  files: MdFile[]
}

const FILTER_ALL = 'all'
const FILTER_UNTAGGED = 'untagged'

type FilterValue = typeof FILTER_ALL | typeof FILTER_UNTAGGED | string

type GroupBy = 'folder' | 'tag'

function getFolderName(path: string): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length < 2) return 'Workspace'
  return parts[parts.length - 2]
}

function TagDot({ color }: { color: string }): React.JSX.Element {
  return (
    <span
      className="size-2 shrink-0 rounded-full border border-white/20"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  )
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
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            {file.tags.length > 0 && (
              <div className="ml-1.5 flex items-center gap-1">
                {file.tags.map((tag) => (
                  <TagDot key={tag.name} color={tag.color} />
                ))}
              </div>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

function TagFilterChip({
  label,
  color,
  selected,
  onPress
}: {
  label: string
  color?: string
  selected: boolean
  onPress: () => void
}): React.JSX.Element {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1 rounded-full border px-2.5 text-[11px]"
      style={
        color
          ? {
              borderColor: color,
              backgroundColor: selected ? color : undefined,
              color: selected ? '#ffffff' : color
            }
          : undefined
      }
      onPress={onPress}
    >
      {color && (
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: selected ? '#ffffff' : color }}
          aria-hidden="true"
        />
      )}
      {label}
    </Button>
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
  const [filterTag, setFilterTag] = useState<FilterValue>(FILTER_ALL)
  const [groupBy, setGroupBy] = useState<GroupBy>('folder')

  const filteredFiles = useMemo(() => {
    if (filterTag === FILTER_ALL) return files
    if (filterTag === FILTER_UNTAGGED) return files.filter((file) => file.tags.length === 0)
    return files.filter((file) => file.tags.some((tag) => tag.name === filterTag))
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
        file.tags.forEach((tag) => groups.set(tag.name, [...(groups.get(tag.name) ?? []), file]))
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
    setShowImport(true)
  }

  const handleImport = async (
    mode: 'copy' | 'copy-and-delete' | 'reference',
    tag?: Tag
  ): Promise<void> => {
    await importFiles({ paths: droppedPaths, mode, tag })
    setShowImport(false)
    setDroppedPaths([])
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
                  <TagFilterChip
                    label="All"
                    selected={filterTag === FILTER_ALL}
                    onPress={() => setFilterTag(FILTER_ALL)}
                  />
                  <TagFilterChip
                    label="Untagged"
                    selected={filterTag === FILTER_UNTAGGED}
                    onPress={() => setFilterTag(FILTER_UNTAGGED)}
                  />
                  {tags.map((tag) => (
                    <TagFilterChip
                      key={tag.name}
                      label={tag.name}
                      color={tag.color}
                      selected={filterTag === tag.name}
                      onPress={() => setFilterTag(tag.name)}
                    />
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
                <MarkdownPreview content={content} />
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

      <ImportFilesModal
        isOpen={showImport}
        onClose={() => {
          setShowImport(false)
          setDroppedPaths([])
        }}
        paths={droppedPaths}
        existingTags={tags}
        onConfirm={handleImport}
      />
    </main>
  )
}
