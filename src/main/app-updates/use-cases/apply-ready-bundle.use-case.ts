/** User action "Reload to update": switch the windows to the newest downloaded bundle. Returns the snapshot. */
import type { AppUpdatesSnapshot } from '../../../shared/app-updates/types'
import { getSnapshot, setRunning } from '../sync'
import { chooseBundle } from './choose-bundle.use-case'

export function applyReadyBundle(): AppUpdatesSnapshot {
  setRunning(chooseBundle())
  return getSnapshot()
}
