import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useArtifactoryItems } from '../items/hooks/use-artifactory-items'
import { useArtifactoryTabs } from '../layout/tabs/hooks/use-artifactory-tabs'
import { ArtifactoryTabs } from '../layout/tabs/components/artifactory-tabs'
import { useFeatureMenu } from '../../../shared/components/feature-menu-context'
import { ArtifactoryChannel } from '../../../../../shared/artifactory/channels'
import type { Tag as TagType } from '../../../../../shared/artifactory/types'
import { ImportFilesModal } from '../import/components/import-files-modal'
import { ArtifactoryViewer } from '../viewer/components/artifactory-viewer'
import { ArtifactorySidebar } from '../layout/sidebar/components/artifactory-sidebar'
import { useSidebarGroups } from '../layout/sidebar/hooks/use-sidebar-groups'
import { ArtifactoryLayout } from '../layout/components/artifactory-layout'
import { SplitView } from '../layout/components/split-view'

const FILTER_ALL = 'all'

type FilterValue = typeof FILTER_ALL | string

type FilterItem = {
  id: FilterValue
  label: string
  color?: string
}

type GroupBy = 'folder' | 'tag'

export function ArtifactoryPage(): React.JSX.Element {
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
  } = useArtifactoryItems()
  const [isEditing, setIsEditing] = useState(false)
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const featureMenu = useFeatureMenu()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [droppedPaths, setDroppedPaths] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)
  const [filterTag, setFilterTag] = useState<FilterValue>(FILTER_ALL)
  const [groupBy, setGroupBy] = useState<GroupBy>('folder')
  const [split, setSplit] = useState<{ left: string; right: string } | null>(null)
  const [pinnedPaths, setPinnedPaths] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    path: string
  } | null>(null)
  const isStandaloneArtifactory =
    new URLSearchParams(window.location.search).get('artifactoryWindow') === '1'
  const { visibleTabs } = useArtifactoryTabs({ openFiles, split, active, pinnedPaths })

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

  const fileGroups = useSidebarGroups(files, filterTag, groupBy)

  useEffect(() => {
    if (!featureMenu) return
    featureMenu.setContribution({
      isOpen: isSidebarOpen,
      onToggle: () => setSidebarOpen(!isSidebarOpen),
      label: 'Files'
    })
    return () => featureMenu.setContribution(null)
  }, [featureMenu, isSidebarOpen, setSidebarOpen])

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

  const sidebar = (
    <ArtifactorySidebar
      filesCount={files.length}
      isExpanded={isSidebarOpen}
      onOpenFile={openFile}
      onToggleExpanded={() => setSidebarOpen(!isSidebarOpen)}
      showToggle={!featureMenu}
      groupBy={groupBy}
      onGroupByChange={setGroupBy}
      filterItems={filterItems}
      filterTag={filterTag}
      onFilterChange={setFilterTag}
      isDragging={isDragging}
      fileGroups={fileGroups}
      active={active}
      onSelect={openPath}
    />
  )

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
    setSidebarOpen(false)
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

  const togglePin = (path: string): void => {
    const splitPaths =
      split && (split.left === path || split.right === path) ? [split.left, split.right] : [path]
    const isPinned = splitPaths.every((item) => pinnedPaths.includes(item))
    setPinnedPaths((current) =>
      isPinned
        ? current.filter((item) => !splitPaths.includes(item))
        : Array.from(new Set([...current, ...splitPaths]))
    )
  }

  const renderSplitView = (): React.JSX.Element => (
    <SplitView
      onClose={() => setSplit(null)}
      left={
        <ArtifactoryViewer
          file={splitFiles?.left ?? null}
          content={splitFiles?.left?.content ?? ''}
          isEditing={false}
          isStandalone={false}
          onEdit={() => openPath(splitFiles?.left?.path ?? '')}
          onSave={handleSave}
          onCancel={handleCancel}
          onChange={() => {}}
          onExpand={() => window.electron.ipcRenderer.send(ArtifactoryChannel.Expand)}
        />
      }
      right={
        <ArtifactoryViewer
          file={splitFiles?.right ?? null}
          content={splitFiles?.right?.content ?? ''}
          isEditing={false}
          isStandalone={false}
          onEdit={() => openPath(splitFiles?.right?.path ?? '')}
          onSave={handleSave}
          onCancel={handleCancel}
          onChange={() => {}}
          onExpand={() => window.electron.ipcRenderer.send(ArtifactoryChannel.Expand)}
        />
      }
    />
  )

  return (
    <ArtifactoryLayout
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden border-y border-separator">
        {featureMenu
          ? featureMenu.panelSlot
            ? createPortal(sidebar, featureMenu.panelSlot)
            : null
          : sidebar}

        <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label="Artifactory preview">
          <ArtifactoryTabs
            tabs={visibleTabs}
            active={active}
            pinnedPaths={pinnedPaths}
            onSelect={setActive}
            onTogglePin={togglePin}
            onClose={handleCloseFile}
            onContextMenu={(event, path) => {
              event.preventDefault()
              setContextMenu({ x: event.clientX, y: event.clientY, path })
            }}
          />

          {isEditing ? (
            <ArtifactoryViewer
              file={activeFile}
              content={activeContent}
              isEditing
              isStandalone={isStandaloneArtifactory}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={(content) => {
                if (activeFile) {
                  setDrafts((current) => ({ ...current, [activeFile.path]: content }))
                }
              }}
              onExpand={() => window.electron.ipcRenderer.send(ArtifactoryChannel.Expand)}
            />
          ) : splitFiles ? (
            renderSplitView()
          ) : (
            <ArtifactoryViewer
              file={activeFile}
              content={activeContent}
              isEditing={false}
              isStandalone={isStandaloneArtifactory}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={() => {}}
              onExpand={() => window.electron.ipcRenderer.send(ArtifactoryChannel.Expand)}
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
                onMouseDown={(event) => event.preventDefault()}
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
          <div className="space-y-0.5">
            <button
              type="button"
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-secondary"
              onMouseDown={(event) => event.preventDefault()}
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
              onMouseDown={(event) => event.preventDefault()}
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
    </ArtifactoryLayout>
  )
}
