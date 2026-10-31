/**
 * Deletes bundles no window will run again: those built for another installed app version (after
 * a .dmg update) and those older than the newest confirmed one. Keeps everything from the newest
 * confirmed bundle up, so a new bundle that fails falls back to it. Rows and folders go together.
 */
import { rmSync } from 'fs'
import { app } from 'electron'
import { deleteBundles, listBundles } from '../db/tables/bundles/queries'

export function pruneBundles(): void {
  const baseVersion = app.getVersion()
  const all = listBundles()
  const keepFrom =
    all.find((bundle) => bundle.baseVersion === baseVersion && bundle.status === 'confirmed')
      ?.build ?? 0
  const stale = all.filter(
    (bundle) => bundle.baseVersion !== baseVersion || bundle.build < keepFrom
  )
  for (const bundle of stale) rmSync(bundle.dir, { recursive: true, force: true })
  deleteBundles(stale.map((bundle) => bundle.build))
}
