/** A bundle's UI rendered for the first time: mark it `confirmed` and delete the older bundles. */
import { findBundle, setBundleStatus } from '../db/tables/bundles/queries'
import { getRunning, setRunning } from '../sync'
import { pruneBundles } from './prune-bundles.use-case'

export function confirmBundle(build: number): void {
  if (findBundle(build)?.status !== 'downloaded') return
  setBundleStatus(build, 'confirmed')
  pruneBundles()
  if (getRunning()?.build === build) setRunning(findBundle(build))
}
