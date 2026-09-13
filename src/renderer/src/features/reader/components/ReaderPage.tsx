import {
  FileText,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  UploadCloud,
  X
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import { useFiles } from '../hooks/useFiles'
import type { MdFile, Tag as TagType } from '../../../../../shared/reader/types'
import { ImportFilesModal } from './ImportFilesModal'
import { ReaderDocument } from './ReaderDocument'
import { FileGroupSection } from './FileGroupSection'
import { TagFilterChip } from './TagFilterChip'
import { ReaderWindowChrome } from './ReaderWindowChrome'
import { SplitView } from './SplitView'

const FILTER_ALL = 'all'

type FilterValue = typeof FILTER_ALL | string

type FilterItem = {
  id: FilterValue
  label: string
  color?: string
}

type GroupBy = 'folder' | 'tag'

function getFolderName(path: string): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length < 2) return 'Workspace'
  return parts[parts.length - 2]
}

export function ReaderPage(): React.JSX.Element {
  const {
    files,
    openFiles,
    active,
    activeFile,
    openFile,
    importFiles,
    saveFile,
    closeFile,
    openPath,
    setActive,
    tags
  } = useFiles()
  const [isEditing, setIsEditing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [droppedPaths, setDroppedPaths] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)
  const [filterTag, setFilterTag] = useState<FilterValue>(FILTER_ALL)
  const [groupBy, setGroupBy] = useState<GroupBy>('folder')
  const [split, setSplit] = useState<{ left: string; right: string } | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    path: string
  } | null>(null)
  const isStandaloneReader = new URLSearchParams(window.location.search).get('readerWindow') === '1'

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contextMenu) {
      menuRef.current?.focus()
    }
  }, [contextMenu])

  const splitFiles = useMemo(
    () =>
      split
        ? {
            left: files.find((file) => file.path === split.left) ?? null,
            right: files.find((file) => file.path === split.right) ?? null
          }
        : null,
    [files, split]
  )

  const filteredFiles = useMemo(() => {
    if (filterTag === FILTER_ALL) return files
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

  const filterItems = useMemo<FilterItem[]>(() => {
    const tagItems: FilterItem[] = tags.map((tag) => ({
      id: tag.name,
      label: tag.name,
      color: tag.color
    }))
    if (filterTag === FILTER_ALL) return [{ id: FILTER_ALL, label: 'All' }, ...tagItems]
    const selected = tagItems.find((item) => item.id === filterTag)
    return selected
      ? [
          { id: FILTER_ALL, label: 'All' },
          selected,
          ...tagItems.filter((item) => item.id !== filterTag)
        ]
      : [{ id: FILTER_ALL, label: 'All' }, ...tagItems]
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
    if (split?.left === path || split?.right === path) {
      setSplit(null)
    }
    if (contextMenu?.path === path) {
      setContextMenu(null)
    }
  }

  const renderTabs = (): React.JSX.Element | null => {
    if (openFiles.length === 0) return null

    const renderTab = (file: MdFile): React.JSX.Element => (
      <div
        key={file.path}
        role="button"
        tabIndex={0}
        aria-selected={active === file.path}
        className={`group flex h-7 max-w-[10rem] shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-[11px] transition-colors ${
          active === file.path
            ? 'border-border bg-surface text-foreground'
            : 'border-transparent text-muted hover:bg-surface hover:text-foreground'
        }`}
        onClick={() => setActive(file.path)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') setActive(file.path)
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
    )

    const splitPaths = split ? new Set([split.left, split.right]) : new Set<string>()
    const splitTabs = openFiles.filter((file) => splitPaths.has(file.path))
    const regularTabs = openFiles.filter((file) => !splitPaths.has(file.path))

    return (
      <div className="flex items-center gap-1 border-b border-separator px-2 py-1.5">
        {regularTabs.map(renderTab)}
        {splitTabs.length > 0 && (
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-secondary p-0.5">
            {splitTabs.map(renderTab)}
          </div>
        )}
      </div>
    )
  }

  const renderSplitView = (): React.JSX.Element => (
    <SplitView
      onClose={() => setSplit(null)}
      left={
        <ReaderDocument
          file={splitFiles?.left ?? null}
          content={splitFiles?.left?.content ?? ''}
          isEditing={false}
          isStandalone={false}
          onEdit={() => openPath(splitFiles?.left?.path ?? '')}
          onSave={handleSave}
          onCancel={handleCancel}
          onChange={() => {}}
          onExpand={() => window.electron.ipcRenderer.send('files:expand')}
        />
      }
      right={
        <ReaderDocument
          file={splitFiles?.right ?? null}
          content={splitFiles?.right?.content ?? ''}
          isEditing={false}
          isStandalone={false}
          onEdit={() => openPath(splitFiles?.right?.path ?? '')}
          onSave={handleSave}
          onCancel={handleCancel}
          onChange={() => {}}
          onExpand={() => window.electron.ipcRenderer.send('files:expand')}
        />
      }
    />
  )

  return (
    <main
      className="mx-auto flex h-screen w-full max-w-[1600px] flex-col px-1 pb-4 pt-10"
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isStandaloneReader && <ReaderWindowChrome />}
      <div className="flex min-h-0 flex-1 overflow-hidden border-y border-separator">
        <aside
          className={`flex shrink-0 flex-col border-r border-separator py-3 transition-[width,padding] duration-200 ${isSidebarOpen ? 'w-52' : 'w-12'}`}
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

                  {filterItems.map((item, index) => (
                    <Fragment key={item.id}>
                      {index === 1 && (
                        <span
                          className="mx-0.5 h-5 w-px shrink-0 bg-separator"
                          aria-hidden="true"
                        />
                      )}
                      <TagFilterChip
                        label={item.label}
                        color={item.color}
                        selected={filterTag === item.id}
                        onPress={() => setFilterTag(item.id)}
                      />
                    </Fragment>
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
                      onSelect={openPath}
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

          {isEditing ? (
            <ReaderDocument
              file={activeFile}
              content={activeContent}
              isEditing
              isStandalone={isStandaloneReader}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={(content) => {
                if (activeFile) {
                  setDrafts((current) => ({ ...current, [activeFile.path]: content }))
                }
              }}
              onExpand={() => window.electron.ipcRenderer.send('files:expand')}
            />
          ) : splitFiles ? (
            renderSplitView()
          ) : (
            <ReaderDocument
              file={activeFile}
              content={activeContent}
              isEditing={false}
              isStandalone={isStandaloneReader}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={() => {}}
              onExpand={() => window.electron.ipcRenderer.send('files:expand')}
            />
          )}
        </section>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          tabIndex={-1}
          onBlur={() => window.setTimeout(() => setContextMenu(null), 0)}
          className="fixed z-50 w-52 rounded-lg border border-border bg-surface p-1 shadow-overlay"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {split && (split.left === contextMenu.path || split.right === contextMenu.path) && (
            <>
              <button
                type="button"
                className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-secondary"
                onClick={() => {
                  setSplit(null)
                  setContextMenu(null)
                }}
              >
                Unsplit
              </button>
              <div className="my-1 h-px bg-border" />
            </>
          )}
          <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted">
            Split active tab with {files.find((file) => file.path === contextMenu.path)?.name}
          </p>
          <div className="space-y-0.5">
            <button
              type="button"
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-secondary"
              onClick={() => {
                if (active && active !== contextMenu.path) {
                  setSplit({ left: active, right: contextMenu.path })
                }
                setContextMenu(null)
              }}
            >
              Split to the right
            </button>
            <button
              type="button"
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-secondary"
              onClick={() => {
                if (active && active !== contextMenu.path) {
                  setSplit({ left: contextMenu.path, right: active })
                }
                setContextMenu(null)
              }}
            >
              Split to the left
            </button>
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
