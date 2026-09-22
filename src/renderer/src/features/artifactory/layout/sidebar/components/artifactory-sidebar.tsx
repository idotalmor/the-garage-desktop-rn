import {
  FileText,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  UploadCloud
} from 'lucide-react'
import { Fragment } from 'react'
import { Button } from '@heroui/react'
import type { MdFile } from '../../../../../../../shared/artifactory/types'
import { FileGroupSection } from './file-group-section'
import { TagFilterChip } from './tag-filter-chip'

type FilterItem = {
  id: string
  label: string
  color?: string
}

type FileGroup = {
  name: string
  files: MdFile[]
}

type ArtifactorySidebarProps = {
  filesCount: number
  isExpanded: boolean
  onOpenFile: () => void
  onToggleExpanded: () => void
  groupBy: 'folder' | 'tag'
  onGroupByChange: (value: 'folder' | 'tag') => void
  filterItems: FilterItem[]
  filterTag: string
  onFilterChange: (value: string) => void
  isDragging: boolean
  fileGroups: FileGroup[]
  active: string | null
  onSelect: (path: string) => void
}

export function ArtifactorySidebar({
  filesCount,
  isExpanded,
  onOpenFile,
  onToggleExpanded,
  groupBy,
  onGroupByChange,
  filterItems,
  filterTag,
  onFilterChange,
  isDragging,
  fileGroups,
  active,
  onSelect
}: ArtifactorySidebarProps): React.JSX.Element {
  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-separator py-3 transition-[width,padding] duration-200 ${isExpanded ? 'w-52' : 'w-12'}`}
      aria-label="Markdown files"
    >
      <div
        className={`flex items-center px-2 ${isExpanded ? 'justify-between' : 'justify-center'}`}
      >
        {isExpanded && (
          <div>
            <p className="text-xs font-semibold">Files</p>
            <p className="mt-0.5 text-[11px] text-muted">{filesCount} opened</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          {isExpanded && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-6 rounded-lg text-muted"
              aria-label="Open Markdown file"
              onPress={onOpenFile}
            >
              <FolderOpen size={14} aria-hidden="true" />
            </Button>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-6 rounded-lg text-muted"
            aria-label={isExpanded ? 'Collapse files sidebar' : 'Expand files sidebar'}
            onPress={onToggleExpanded}
          >
            {isExpanded ? (
              <PanelLeftClose size={14} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={14} aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="mb-3">
            <div className="flex items-center gap-1 overflow-x-auto px-2 py-1">
              <Button
                isIconOnly
                size="sm"
                variant={groupBy === 'folder' ? 'secondary' : 'ghost'}
                className="size-7 rounded-md"
                onPress={() => onGroupByChange('folder')}
                aria-label="Group by folder"
              >
                <Folder size={14} aria-hidden="true" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant={groupBy === 'tag' ? 'secondary' : 'ghost'}
                className="size-7 rounded-md"
                onPress={() => onGroupByChange('tag')}
                aria-label="Group by tag"
              >
                <Tag size={14} aria-hidden="true" />
              </Button>

              {filterItems.map((item, index) => (
                <Fragment key={item.id}>
                  {index === 1 && (
                    <span className="mx-0.5 h-5 w-px shrink-0 bg-separator" aria-hidden="true" />
                  )}
                  <TagFilterChip
                    label={item.label}
                    color={item.color}
                    selected={filterTag === item.id}
                    onPress={() => onFilterChange(item.id)}
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
                  onSelect={onSelect}
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
  )
}
