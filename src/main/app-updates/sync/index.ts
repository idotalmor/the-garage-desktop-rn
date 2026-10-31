/**
 * App updates at runtime: the running bundle, the periodic check and the UI snapshot.
 * `startUpdates()` wires them once at startup. Use cases, `windows.ts` and `ipc.ts` import from here.
 */
import { chooseBundle } from '../use-cases/choose-bundle.use-case'
import { pruneBundles } from '../use-cases/prune-bundles.use-case'
import { updatesEnabled } from '../utils/settings'
import { startChecks } from './checker'
import { notify } from './snapshot'
import { onStateEvent, setRunning } from './state'

export { runCheck } from './checker'
export { getSnapshot, notify, subscribe } from './snapshot'
export { getRunning, setRunning } from './state'

/** Called when the windows must load another bundle (or the UI inside the app). */
export function onRunningChanged(listener: () => void): () => void {
  return onStateEvent('running', listener)
}

/** Call once at startup, before the first window opens, so it loads the right bundle. */
export function startUpdates(): void {
  onStateEvent('changed', notify)
  if (!updatesEnabled()) return
  pruneBundles()
  setRunning(chooseBundle())
  startChecks()
}
