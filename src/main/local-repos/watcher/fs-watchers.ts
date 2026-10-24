/**
 * Owns the recursive `fs.watch` handles (FSEvents on macOS). This is the only place that watches
 * the filesystem. `syncWatchers` opens and closes watchers so they match the wanted folders.
 */
import { watch, type FSWatcher } from 'fs'
import { join } from 'path'

const watchers = new Map<string, FSWatcher>()

/** Watches exactly `paths` (recursively) and calls `onChange` with the absolute changed path. */
export function syncWatchers(paths: string[], onChange: (path: string) => void): void {
  const wanted = new Set(paths)
  for (const [path, watcher] of watchers) {
    if (wanted.has(path)) continue
    watcher.close()
    watchers.delete(path)
  }
  for (const path of wanted) {
    if (watchers.has(path)) continue
    try {
      const watcher = watch(path, { recursive: true, persistent: false }, (_event, filename) =>
        onChange(filename ? join(path, filename.toString()) : path)
      )
      // A watched folder that disappears errors out; it is reopened on the next sync if it's back.
      watcher.on('error', () => {
        watcher.close()
        watchers.delete(path)
      })
      watchers.set(path, watcher)
    } catch {
      // Folder doesn't exist (yet); retried on the next sync.
    }
  }
}

export function closeAllWatchers(): void {
  for (const watcher of watchers.values()) watcher.close()
  watchers.clear()
}
