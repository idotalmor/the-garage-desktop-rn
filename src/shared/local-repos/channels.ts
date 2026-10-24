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
  /** Saves the repo order shown in the UI: an array of repo ids, first = top. */
  SetOrder: 'local-repos:set-order',
  /** Opens a checkout folder in an IDE or Terminal (`open -a`), args: ide id, absolute path. */
  OpenIde: 'local-repos:open-ide',
  /** Opens a checkout folder in Finder, arg: absolute path. */
  OpenFolder: 'local-repos:open-folder',
  /** Moves a checkout folder to the Trash and refreshes its repo, args: path, alsoDeleteRemote. */
  DeleteWorktree: 'local-repos:delete-worktree',
  /** Main → renderer push with a fresh `LocalReposSnapshot` whenever anything changes. */
  Changed: 'local-repos:changed'
} as const
