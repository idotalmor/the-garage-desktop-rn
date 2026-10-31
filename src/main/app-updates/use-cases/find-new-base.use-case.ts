/**
 * Background job (run by `sync`): reads the latest base release from GitHub and returns it when it
 * is newer than the installed app, for the "New version" chip (a .dmg reinstall). Null otherwise.
 */
import { app } from 'electron'
import type { NewBase } from '../../../shared/app-updates/types'
import { fetchLatestBase, releasePageUrl } from '../releases'
import { buildOf } from '../utils/versions'

export async function findNewBase(): Promise<NewBase | null> {
  const latest = await fetchLatestBase()
  if (!latest || latest.build <= buildOf(app.getVersion())) return null
  return { version: latest.version, url: releasePageUrl(latest.version) }
}
