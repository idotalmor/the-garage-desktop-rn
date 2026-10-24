/** Opens a checkout folder in Finder. Throws when the path can't be opened (e.g. it's gone). */
import { shell } from 'electron'

export async function openFolder(path: string): Promise<void> {
  const error = await shell.openPath(path)
  if (error) throw new Error(error)
}
