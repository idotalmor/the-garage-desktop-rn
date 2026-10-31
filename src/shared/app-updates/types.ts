/** What the renderer knows about app updates: which versions run now and what is ready to install. */

/** A downloaded, verified JS bundle newer than the UI running now. */
export type ReadyBundle = {
  /** The bundle's version, e.g. `1.0.57`. */
  version: string
  /** Its CI build number (the last part of `version`). */
  build: number
}

/** A newer installed-app release (.dmg) on GitHub, needed when an update changes native code. */
export type NewBase = {
  /** Its version, e.g. `1.0.60`. */
  version: string
  /** Its GitHub release page, where the .dmg is downloaded. */
  url: string
}

export type AppUpdatesSnapshot = {
  /** False in dev and in builds made without a bundle public key: nothing is checked or downloaded. */
  enabled: boolean
  /** Version of the installed app (the .dmg), from `app.getVersion()`. */
  baseVersion: string
  /** Version of the UI running now: the loaded bundle's version, or `baseVersion` for the UI inside the app. */
  runningVersion: string
  /** Reloading the windows switches to this bundle. Null when there is none. */
  readyBundle: ReadyBundle | null
  /** Null when the installed app is the latest one. */
  newBase: NewBase | null
  /** True while a check or download is running. */
  checking: boolean
  /** When the last check finished (epoch ms), null before the first one. */
  lastCheckedAt: number | null
  /** Why the last check failed, null if it worked. */
  lastError: string | null
}
