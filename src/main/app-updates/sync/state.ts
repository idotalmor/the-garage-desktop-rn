/**
 * Runtime state of app updates: the bundle the windows run now and the last check's result.
 * Emits `running` when the windows must switch bundles and `changed` for every snapshot change.
 */
import { EventEmitter } from 'events'
import type { NewBase } from '../../../shared/app-updates/types'
import type { BundleDbEntity } from '../db/tables/bundles/schema'

export type CheckState = {
  /** A check or download is in flight. */
  checking: boolean
  /** When the last check finished (epoch ms). */
  lastCheckedAt: number | null
  /** Why the last check failed. */
  lastError: string | null
  /** Newer base release found by the last successful check. */
  newBase: NewBase | null
}

const events = new EventEmitter()
let running: BundleDbEntity | null = null
let check: CheckState = { checking: false, lastCheckedAt: null, lastError: null, newBase: null }

export function getRunning(): BundleDbEntity | null {
  return running
}

/** Sets the bundle to run (null = the UI inside the app); emits `running` if the build changed. */
export function setRunning(bundle: BundleDbEntity | null): void {
  const changed = (bundle?.build ?? null) !== (running?.build ?? null)
  running = bundle
  if (changed) events.emit('running', bundle)
  events.emit('changed')
}

export function getCheck(): CheckState {
  return check
}

export function setCheck(patch: Partial<CheckState>): void {
  check = { ...check, ...patch }
  events.emit('changed')
}

export function onStateEvent(
  event: 'running' | 'changed',
  listener: (bundle?: BundleDbEntity | null) => void
): () => void {
  events.on(event, listener)
  return () => events.off(event, listener)
}
