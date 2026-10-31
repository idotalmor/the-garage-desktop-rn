/**
 * Which downloaded bundle the windows should run: the newest one built for the installed app that
 * isn't `bad`, is newer than the UI inside the app and is still on disk. Null = the UI inside the app.
 */
import { existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { listBaseBundles } from '../db/tables/bundles/queries'
import type { BundleDbEntity } from '../db/tables/bundles/schema'
import { updatesEnabled } from '../utils/settings'
import { buildOf } from '../utils/versions'

export function chooseBundle(): BundleDbEntity | null {
  if (!updatesEnabled()) return null
  const baseVersion = app.getVersion()
  return (
    listBaseBundles(baseVersion).find(
      (bundle) =>
        bundle.status !== 'bad' &&
        bundle.build > buildOf(baseVersion) &&
        existsSync(join(bundle.dir, 'index.html'))
    ) ?? null
  )
}
