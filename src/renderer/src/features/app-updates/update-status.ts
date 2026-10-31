/** Maps the app updates snapshot to the one top-bar update action to show, if any. */
import type { AppUpdatesSnapshot } from '../../../../shared/app-updates/types'

export type UpdateAction = {
  /** `reload`: a new JS bundle is downloaded. `download`: a new .dmg is needed (native change). */
  kind: 'reload' | 'download'
  /** Chip text. */
  label: string
  /** Tooltip with the versions. */
  title: string
}

/** A ready bundle wins: it installs in a second, and a newer .dmg is still offered after it. */
export function updateAction(snapshot: AppUpdatesSnapshot | null): UpdateAction | null {
  if (!snapshot?.enabled) return null
  if (snapshot.readyBundle) {
    return {
      kind: 'reload',
      label: 'Update',
      title: `Reload to update ${snapshot.runningVersion} → ${snapshot.readyBundle.version}`
    }
  }
  if (snapshot.newBase) {
    return {
      kind: 'download',
      label: 'New version',
      title: `The Garage ${snapshot.newBase.version} needs a reinstall: download the .dmg and drag it into Applications`
    }
  }
  return null
}
