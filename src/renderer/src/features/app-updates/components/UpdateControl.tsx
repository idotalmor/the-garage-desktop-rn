/** Top-bar chip shown when an update is available: reload to a new JS bundle, or download a new .dmg. */
import { Download, RotateCw } from 'lucide-react'
import { Button } from '@heroui/react'
import { useAppUpdates } from '../hooks/use-app-updates'
import { updateAction } from '../update-status'

export function UpdateControl(): React.JSX.Element | null {
  const { snapshot, reload, openBaseDownload } = useAppUpdates()
  const action = updateAction(snapshot)
  if (!action) return null
  const Icon = action.kind === 'reload' ? RotateCw : Download

  return (
    <Button
      size="sm"
      variant="secondary"
      className="h-6 min-w-0 gap-1 rounded-full px-2.5 text-[11px]"
      onPress={action.kind === 'reload' ? reload : openBaseDownload}
      aria-label={action.title}
    >
      <Icon size={12} aria-hidden="true" />
      <span title={action.title}>{action.label}</span>
    </Button>
  )
}
