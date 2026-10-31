/**
 * A bundle failed its first load (no ready report, load error, renderer crash): mark it `bad`,
 * delete its files and switch the windows back to the previous bundle or the UI inside the app.
 */
import { rmSync } from 'fs'
import { findBundle, setBundleStatus } from '../db/tables/bundles/queries'
import { setRunning } from '../sync'
import { chooseBundle } from './choose-bundle.use-case'

export function rejectBundle(build: number, reason: string): void {
  const bundle = findBundle(build)
  if (bundle?.status !== 'downloaded') return
  console.error(`[app-updates] bundle ${bundle.version} failed: ${reason}`)
  setBundleStatus(build, 'bad', reason)
  rmSync(bundle.dir, { recursive: true, force: true })
  setRunning(chooseBundle())
}
