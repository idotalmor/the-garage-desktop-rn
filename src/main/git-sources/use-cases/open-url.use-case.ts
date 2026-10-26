/** Opens validated GitHub web links in the system browser, independently of the originating app window. */
import { shell } from 'electron'

export async function openUrl(value: unknown): Promise<void> {
  if (typeof value !== 'string' || !value || value.length > 2048)
    throw new Error('Invalid GitHub URL.')
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Invalid GitHub URL.')
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'github.com' ||
    url.port ||
    url.username ||
    url.password
  )
    throw new Error('Only HTTPS GitHub links without credentials may be opened.')
  await shell.openExternal(url.toString())
}
