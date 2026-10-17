import { useMemo, useState } from 'react'
import { useArtifactoryItems } from '../items/hooks/use-artifactory-items'
import type { Tag as TagType } from '../../../../../shared/artifactory/types'
import { ImportFilesModal } from '../import/components/import-files-modal'
import { useBoxes } from '../boxes/hooks/use-boxes'
import { BoxesHome } from '../boxes/components/boxes-home'
import { BoxDetail } from '../boxes/components/box-detail'
import {
  ArtifactoryViewSwitch,
  type ArtifactoryView
} from '../boxes/components/artifactory-view-switch'
import { ArtifactoryExplorer } from './artifactory-explorer'

export function ArtifactoryPage(): React.JSX.Element {
  const isStandaloneArtifactory =
    new URLSearchParams(window.location.search).get('artifactoryWindow') === '1'
  const items = useArtifactoryItems()
  const { boxes, createBox, deleteBox, addFileToBox, removeFileFromBox } = useBoxes(
    items.files,
    items.setFileTags
  )
  const [view, setView] = useState<ArtifactoryView>(isStandaloneArtifactory ? 'files' : 'boxes')
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string>('all')
  const [isDragging, setIsDragging] = useState(false)
  const [droppedPaths, setDroppedPaths] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)

  const activeBox = useMemo(
    () => boxes.find((box) => box.name === selectedBox) ?? null,
    [boxes, selectedBox]
  )

  const candidateFiles = useMemo(
    () =>
      activeBox
        ? items.files.filter((file) => !file.tags.some((tag) => tag.name === activeBox.name))
        : [],
    [items.files, activeBox]
  )

  const viewSwitch = <ArtifactoryViewSwitch view={view} onChange={setView} />

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
    await items.importFiles({ paths: droppedPaths, mode, tag })
    setShowImport(false)
    setDroppedPaths([])
  }

  const openFileInExplorer = (path: string): void => {
    items.openPath(path)
    setView('files')
  }

  if (view === 'files') {
    return (
      <ArtifactoryExplorer
        items={items}
        filterTag={filterTag}
        onFilterChange={setFilterTag}
        viewSwitch={viewSwitch}
      />
    )
  }

  if (activeBox) {
    return (
      <>
        <BoxDetail
          box={activeBox}
          candidateFiles={candidateFiles}
          viewSwitch={viewSwitch}
          isDragging={isDragging}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onBack={() => setSelectedBox(null)}
          onOpenFile={openFileInExplorer}
          onOpenInExplorer={() => {
            setFilterTag(activeBox.name)
            setView('files')
          }}
          onAddFile={(path) => void addFileToBox(path, activeBox)}
          onRemoveFile={(path) => void removeFileFromBox(path, activeBox.name)}
          onDelete={() => {
            void deleteBox(activeBox.name)
            setSelectedBox(null)
          }}
        />
        <ImportFilesModal
          isOpen={showImport}
          onClose={() => {
            setShowImport(false)
            setDroppedPaths([])
          }}
          paths={droppedPaths}
          existingTags={items.tags}
          initialTag={{ name: activeBox.name, color: activeBox.color }}
          onConfirm={handleImport}
        />
      </>
    )
  }

  return (
    <BoxesHome
      boxes={boxes}
      filesCount={items.files.length}
      viewSwitch={viewSwitch}
      onOpenBox={setSelectedBox}
      onOpenExplorer={() => setView('files')}
      onCreateBox={(input) => void createBox(input)}
    />
  )
}
