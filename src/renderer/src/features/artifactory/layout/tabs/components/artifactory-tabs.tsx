import type { ArtifactoryTab as ArtifactoryTabModel } from '../hooks/use-artifactory-tabs'
import { ArtifactoryTab } from './artifactory-tab'
import { ArtifactoryTabGroup } from './artifactory-tab-group'

type ArtifactoryTabsProps = {
  tabs: ArtifactoryTabModel[]
  active: string | null
  pinnedPaths: string[]
  onSelect: (path: string) => void
  onTogglePin: (path: string) => void
  onClose: (path: string) => void
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>, path: string) => void
}

export function ArtifactoryTabs({
  tabs,
  active,
  pinnedPaths,
  onSelect,
  onTogglePin,
  onClose,
  onContextMenu
}: ArtifactoryTabsProps): React.JSX.Element | null {
  if (tabs.length === 0) return null

  return (
    <div
      className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-separator px-2 py-1.5"
      role="tablist"
      aria-label="Open documents"
    >
      {tabs.map((tab) => {
        const tabProps = {
          tab,
          isActive: tab.files.some((item) => item.path === active),
          isPinned: tab.files.every((item) => pinnedPaths.includes(item.path)),
          onSelect,
          onTogglePin,
          onClose,
          onContextMenu
        }
        const TabComponent = tab.isCombined ? ArtifactoryTabGroup : ArtifactoryTab
        return <TabComponent key={tab.id} {...tabProps} />
      })}
    </div>
  )
}
