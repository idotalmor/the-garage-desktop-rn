/** IPC channels between the renderer and the main-process app updates. */
export const AppUpdatesChannel = {
  /** Returns the current `AppUpdatesSnapshot`. */
  GetSnapshot: 'app-updates:get-snapshot',
  /** Checks GitHub now (new .dmg, new bundle) and downloads a new bundle. Returns the snapshot. */
  Check: 'app-updates:check',
  /** Reloads every window with the ready bundle. Returns the snapshot. */
  Reload: 'app-updates:reload',
  /** Opens the new base release's GitHub page in the browser. */
  OpenBaseDownload: 'app-updates:open-base-download',
  /** Renderer → main (send): the UI rendered. Confirms a bundle that is running for the first time. */
  Ready: 'app-updates:ready',
  /** Main → renderer push with a fresh `AppUpdatesSnapshot` whenever anything changes. */
  Changed: 'app-updates:changed'
} as const
