/** Sends GitHub web links to main's system-browser opener instead of creating Electron popup windows. */
import { GitSourcesChannel } from '../../../../shared/git-sources/channels'

export function openGitHubUrl(url: string): void {
  void window.electron.ipcRenderer.invoke(GitSourcesChannel.OpenUrl, url).catch(() => {
    console.warn('[git-sources] Could not open GitHub in the default browser.')
  })
}
