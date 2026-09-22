import { ArtifactoryTab } from './artifactory-tab'
import type { ArtifactoryTab as ArtifactoryTabModel } from '../hooks/use-artifactory-tabs'

type ArtifactoryTabGroupProps = {
  tab: ArtifactoryTabModel
  isActive: boolean
  isPinned: boolean
  onSelect: (path: string) => void
  onTogglePin: (path: string) => void
  onClose: (path: string) => void
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>, path: string) => void
}

export function ArtifactoryTabGroup(props: ArtifactoryTabGroupProps): React.JSX.Element {
  return <ArtifactoryTab {...props} />
}
