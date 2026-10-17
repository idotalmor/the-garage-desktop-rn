import { FolderOpen, Package } from 'lucide-react'
import { Button } from '@heroui/react'

export type ArtifactoryView = 'boxes' | 'files'

type ArtifactoryViewSwitchProps = {
  view: ArtifactoryView
  onChange: (view: ArtifactoryView) => void
}

export function ArtifactoryViewSwitch({
  view,
  onChange
}: ArtifactoryViewSwitchProps): React.JSX.Element {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5"
      role="group"
      aria-label="Artifactory view"
    >
      <Button
        size="sm"
        variant={view === 'boxes' ? 'secondary' : 'ghost'}
        className="h-6 gap-1.5 rounded-md px-2 text-[11px]"
        onPress={() => onChange('boxes')}
        aria-pressed={view === 'boxes'}
      >
        <Package size={12} aria-hidden="true" />
        Boxes
      </Button>
      <Button
        size="sm"
        variant={view === 'files' ? 'secondary' : 'ghost'}
        className="h-6 gap-1.5 rounded-md px-2 text-[11px]"
        onPress={() => onChange('files')}
        aria-pressed={view === 'files'}
      >
        <FolderOpen size={12} aria-hidden="true" />
        Files
      </Button>
    </div>
  )
}
