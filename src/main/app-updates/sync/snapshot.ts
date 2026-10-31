/** Builds the `AppUpdatesSnapshot` the UI renders and notifies its subscribers. */
import { EventEmitter } from 'events'
import { app } from 'electron'
import type { AppUpdatesSnapshot } from '../../../shared/app-updates/types'
import { listBaseBundles } from '../db/tables/bundles/queries'
import { updatesEnabled } from '../utils/settings'
import { buildOf } from '../utils/versions'
import { getCheck, getRunning } from './state'

const events = new EventEmitter()

export function getSnapshot(): AppUpdatesSnapshot {
  const enabled = updatesEnabled()
  const baseVersion = app.getVersion()
  const running = getRunning()
  const runningBuild = running?.build ?? buildOf(baseVersion)
  const ready = enabled
    ? listBaseBundles(baseVersion).find((b) => b.status !== 'bad' && b.build > runningBuild)
    : undefined
  const { checking, lastCheckedAt, lastError, newBase } = getCheck()
  return {
    enabled,
    baseVersion,
    runningVersion: running?.version ?? baseVersion,
    readyBundle: ready ? { version: ready.version, build: ready.build } : null,
    newBase,
    checking,
    lastCheckedAt,
    lastError
  }
}

export function notify(): void {
  events.emit('snapshot', getSnapshot())
}

export function subscribe(listener: (snapshot: AppUpdatesSnapshot) => void): () => void {
  events.on('snapshot', listener)
  return () => events.off('snapshot', listener)
}
