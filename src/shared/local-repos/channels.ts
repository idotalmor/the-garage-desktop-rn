/** IPC channels between the renderer and the main-process local repo scanner. */
export const LocalReposChannel = {
  /** Returns the current `LocalReposSnapshot` (sources, repos, scan progress). */
  GetSnapshot: 'local-repos:get-snapshot',
  /** Opens the folder picker, saves the chosen folders and scans them. */
  AddSources: 'local-repos:add-sources',
  /** Forgets a source and drops repos that no other source covers. */
  RemoveSource: 'local-repos:remove-source',
  /** Rescans one source (by id), or all of them when no id is given. */
  Rescan: 'local-repos:rescan',
  /** Deletes every source, repo and worktree from the local DB. */
  Reset: 'local-repos:reset',
  /** Main → renderer push with a fresh `LocalReposSnapshot` whenever anything changes. */
  Changed: 'local-repos:changed'
} as const
