/** IPC channels between the renderer and the main-process local repo scanner. */
export const LocalReposChannel = {
  /** Returns the current `LocalReposSnapshot` (scan folders, repos, scan progress). */
  GetSnapshot: 'local-repos:get-snapshot',
  /** Opens the folder picker, saves the chosen folders and scans them. */
  AddScanFolders: 'local-repos:add-scan-folders',
  /** Forgets a scan folder and drops repos that no other scan folder covers. */
  RemoveScanFolder: 'local-repos:remove-scan-folder',
  /** Rescans one scan folder (by id), or all of them when no id is given. */
  Rescan: 'local-repos:rescan',
  /** Main → renderer push with a fresh `LocalReposSnapshot` whenever anything changes. */
  Changed: 'local-repos:changed'
} as const
