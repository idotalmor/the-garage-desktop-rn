/** IPC contract for Git source actions and snapshot pushes. */
export const GitSourcesChannel = {
  /** Open a validated GitHub HTTPS link in the default system browser, not an app popup. */
  OpenUrl: 'git-sources:open-url',
  /** Read connected accounts, cached repos, favorites and pending authorization. */
  GetSnapshot: 'git-sources:get-snapshot',
  /** Begin GitHub device authorization and open the browser. */
  Connect: 'git-sources:connect',
  /** Poll a pending device authorization until completed or canceled. */
  Complete: 'git-sources:complete',
  /** Cancel pending device authorization. */
  Cancel: 'git-sources:cancel',
  /** Browse one page of an account's accessible repos. */
  ListRepos: 'git-sources:list-repos',
  /** Set an explicit in-app repo favorite. */
  SetFavorite: 'git-sources:set-favorite',
  /** Refresh cached repos for an account. */
  Refresh: 'git-sources:refresh',
  /** Disconnect an account and remove its local connection data. */
  Disconnect: 'git-sources:disconnect',
  /** Plans a clone or linked checkout and suggests a sibling parent folder. */
  PrepareCheckout: 'git-sources:prepare-checkout',
  /** Picks a parent folder, creates the checkout and registers it with local scanning. */
  CreateCheckout: 'git-sources:create-checkout',
  /** Push updated snapshots to all windows. */
  Changed: 'git-sources:changed'
} as const
