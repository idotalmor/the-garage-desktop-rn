/**
 * User action "Download new version": opens the newer base release's GitHub page, where the user
 * downloads the .dmg. Installing it is manual until the app is signed with an Apple Developer ID.
 */
import { shell } from 'electron'
import { getSnapshot } from '../sync'

export async function openBaseDownload(): Promise<void> {
  const url = getSnapshot().newBase?.url
  if (url) await shell.openExternal(url)
}
