/** Fixed settings of app updates: where releases live, how often to check, where bundles go, and whether updates run at all. */
import { app } from 'electron'
import { join } from 'path'

/** Wait after startup before the first check, so it doesn't compete with the first scan. */
export const FIRST_CHECK_DELAY_MS = 10_000
/** How often a running app checks GitHub again. */
export const CHECK_INTERVAL_MS = 30 * 60_000
/** How long a bundle that runs for the first time has to report ready after its page loaded. */
export const READY_TIMEOUT_MS = 15_000

/** GitHub releases of the app. `DEVFLOW_RELEASES_URL` points it at another server (local checks). */
export function releasesUrl(): string {
  return (
    process.env['DEVFLOW_RELEASES_URL'] ??
    'https://github.com/idotalmor/the-garage-desktop-rn/releases'
  )
}

/** `~/.devflow/app-updates/bundles`: one unpacked folder per downloaded bundle build. */
export function bundlesDir(): string {
  return join(app.getPath('home'), '.devflow', 'app-updates', 'bundles')
}

/** Key bundles must be signed with (built in by CI), or null for local builds. */
export function bundlePublicKey(): string | null {
  return import.meta.env.MAIN_VITE_BUNDLE_PUBLIC_KEY || null
}

/** Updates run only in packaged apps built by CI (they carry the public key). */
export function updatesEnabled(): boolean {
  return app.isPackaged && bundlePublicKey() !== null
}
