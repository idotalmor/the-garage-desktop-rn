import {
  FileText,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Save,
  Tag,
  UploadCloud,
  X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import { useFiles } from '../hooks/useFiles'
import type { MdFile, Tag as TagType } from '../../../../../shared/reader/types'
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
  const inactive = !selected
    ? color
      ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
      : 'opacity-60 hover:opacity-100'
    : ''

  return (
    <Button
      size="sm"
      variant="ghost"
      className={`h-7 gap-1 rounded-full border px-2.5 text-[11px] transition-all ${inactive}`}
      style={
        color
          ? {
              borderColor: color,
              backgroundColor: selected ? color : undefined,
              color: selected ? '#ffffff' : color
            }
          : {
              backgroundColor: selected ? 'var(--accent)' : undefined,
              color: selected ? '#ffffff' : undefined
            }
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
  const { files, active, activeFile, openFile, importFiles, saveFile, closeFile, setActive, tags } =
    useFiles()
  const [isEditing, setIsEditing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [droppedPaths, setDroppedPaths] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)
  const [filterTag, setFilterTag] = useState<FilterValue>(FILTER_ALL)
  const [groupBy, setGroupBy] = useState<GroupBy>('folder')
  const [splitFile, setSplitFile] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    path: string
  } | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contextMenu) {
      menuRef.current?.focus()
    }
  }, [contextMenu])

  const splitFileData = useMemo(
    () => files.find((file) => file.path === splitFile) ?? null,
    [files, splitFile]
  )

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

  const filterItems = useMemo(() => {
    const items: { id: FilterValue; label: string; color?: string }[] = [
      { id: FILTER_ALL, label: 'All' },
      { id: FILTER_UNTAGGED, label: 'Untagged' },
      ...tags.map((tag) => ({ id: tag.name, label: tag.name, color: tag.color }))
    ]
    const selectedIndex = items.findIndex((item) => item.id === filterTag)
    if (selectedIndex > 0) {
      const [selected] = items.splice(selectedIndex, 1)
      items.unshift(selected)
    }
    return items
  }, [tags, filterTag])

  const activeContent = activeFile ? (drafts[activeFile.path] ?? activeFile.content) : ''

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
    tag?: TagType
  ): Promise<void> => {
    await importFiles({ paths: droppedPaths, mode, tag })
    setShowImport(false)
    setDroppedPaths([])
  }

  const handleEdit = (): void => {
    if (!activeFile) return
    setIsSidebarOpen(false)
    setIsEditing(true)
  }

  const handleSave = async (): Promise<void> => {
    if (!activeFile) return
    const content = drafts[activeFile.path] ?? activeFile.content
    await saveFile(activeFile, content)
    setDrafts((current) => {
      const next = { ...current }
      delete next[activeFile.path]
      return next
    })
    setIsEditing(false)
  }

  const handleCancel = (): void => {
    if (!activeFile) return
    setDrafts((current) => {
      const next = { ...current }
      delete next[activeFile.path]
      return next
    })
    setIsEditing(false)
  }

  const handleCloseFile = (path: string): void => {
    closeFile(path)
    if (splitFile === path) {
      setSplitFile(null)
    }
    if (contextMenu?.path === path) {
      setContextMenu(null)
    }
  }

  const renderTabs = (): React.JSX.Element | null => {
    if (files.length === 0) return null
    return (
      <div className="flex items-center gap-1 border-b border-separator px-2 py-1.5">
        {files.map((file) => (
          <div
            key={file.path}
            role="button"
            tabIndex={0}
            aria-selected={active === file.path}
            className={`group flex h-7 max-w-[10rem] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-[11px] transition-colors ${
              active === file.path
                ? 'border-border bg-surface-secondary text-foreground'
                : 'border-transparent text-muted hover:bg-surface-secondary hover:text-foreground'
            }`}
            onClick={() => setActive(file.path)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                setActive(file.path)
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              setContextMenu({ x: event.clientX, y: event.clientY, path: file.path })
            }}
          >
            <FileText size={12} aria-hidden="true" />
            <span className="truncate">{file.name}</span>
            <button
              type="button"
              className="rounded p-0.5 text-muted opacity-0 hover:text-foreground group-hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation()
                handleCloseFile(file.path)
              }}
              aria-label={`Close ${file.name}`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  const renderEmpty = (): React.JSX.Element => (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <FileText size={24} className="text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium">Nothing to preview</p>
      <p className="mt-1 text-xs text-muted">Choose a Markdown file from the sidebar.</p>
    </div>
  )

  const renderEditor = (): React.JSX.Element => {
    if (!activeFile) return renderEmpty()
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-separator px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{activeFile.name}</p>
            <p className="truncate text-[11px] text-muted">{activeFile.path}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="primary" className="rounded-lg text-xs" onPress={handleSave}>
              <Save size={14} aria-hidden="true" />
              Save
            </Button>
            <Button
              size="sm"
              variant="danger-soft"
              className="rounded-lg text-xs"
              onPress={handleCancel}
            >
              <X size={14} aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-2 overflow-hidden">
          <div className="min-h-0 overflow-y-auto border-r border-separator px-4 py-5">
            <MarkdownPreview content={activeContent} />
          </div>
          <div className="min-h-0 flex-1 bg-surface-secondary">
            <textarea
              value={activeContent}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [activeFile.path]: event.target.value
                }))
              }
              aria-label={`Edit ${activeFile.name}`}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-foreground outline-none"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderActivePreview = (): React.JSX.Element => {
    if (!activeFile) return renderEmpty()
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-separator px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{activeFile.name}</p>
            <p className="truncate text-[11px] text-muted">{activeFile.path}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-lg text-xs"
              onPress={handleEdit}
            >
              <Pencil size={14} aria-hidden="true" />
              Edit
            </Button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <MarkdownPreview content={activeContent} />
        </div>
      </div>
    )
  }

  const renderSplitView = (): React.JSX.Element => {
    if (!activeFile || !splitFileData) return renderEmpty()
    return (
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col border-r border-separator">
          {renderActivePreview()}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-12 items-center justify-between gap-3 border-b border-separator px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{splitFileData.name}</p>
              <p className="truncate text-[11px] text-muted">{splitFileData.path}</p>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="rounded-lg"
              onPress={() => setSplitFile(null)}
              aria-label="Close split view"
            >
              <X size={14} aria-hidden="true" />
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            <MarkdownPreview content={splitFileData.content} />
          </div>
        </div>
      </div>
    )
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
              <div className="mb-3">
                <div className="flex items-center gap-1 overflow-x-auto px-2 py-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant={groupBy === 'folder' ? 'secondary' : 'ghost'}
                    className="size-7 rounded-md"
                    onPress={() => setGroupBy('folder')}
                    aria-label="Group by folder"
                  >
                    <Folder size={14} aria-hidden="true" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant={groupBy === 'tag' ? 'secondary' : 'ghost'}
                    className="size-7 rounded-md"
                    onPress={() => setGroupBy('tag')}
                    aria-label="Group by tag"
                  >
                    <Tag size={14} aria-hidden="true" />
                  </Button>

                  {filterItems.map((item) => (
                    <TagFilterChip
                      key={item.id}
                      label={item.label}
                      color={item.color}
                      selected={filterTag === item.id}
                      onPress={() => setFilterTag(item.id)}
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
          {renderTabs()}

          {isEditing ? renderEditor() : splitFileData ? renderSplitView() : renderActivePreview()}
        </section>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          tabIndex={-1}
          onBlur={() => setContextMenu(null)}
          className="fixed z-50 w-52 rounded-lg border border-border bg-surface p-1 shadow-overlay"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-secondary"
            onClick={() => handleCloseFile(contextMenu.path)}
          >
            <X size={12} aria-hidden="true" />
            Close
          </button>
          <div className="my-1 h-px bg-border" />
          <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted">
            Split with
          </p>
          <div className="max-h-40 overflow-y-auto">
            {files
              .filter((file) => file.path !== contextMenu.path)
              .map((file) => (
                <button
                  key={file.path}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-secondary"
                  onClick={() => {
                    setSplitFile(file.path)
                    setContextMenu(null)
                  }}
                >
                  <FileText size={12} aria-hidden="true" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}

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
