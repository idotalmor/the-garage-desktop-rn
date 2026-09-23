import { BrowserWindow } from 'electron'
import { existsSync, readFileSync, watch, type FSWatcher } from 'fs'
import { IntegrationChannel } from '../../shared/integrations/channels'
import { providerMemoryPaths } from './providers'
import { readMemoryContent, writeMemoryContent } from './store'

const BLOCK_START = '<!-- devflow:memory:start -->'
const BLOCK_END = '<!-- devflow:memory:end -->'

const watchers = new Map<string, FSWatcher>()
let debounce: ReturnType<typeof setTimeout> | null = null
const pending = new Set<string>()

function broadcastMemoryChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IntegrationChannel.MemoryChanged)
  }
}

function extractMemory(content: string): string {
  const start = content.indexOf(BLOCK_START)
  const end = content.indexOf(BLOCK_END)
  if (start >= 0 && end > start) {
    return content.slice(start + BLOCK_START.length, end).trim()
  }
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '')
  return withoutFrontmatter.trim()
}

function importIfChanged(path: string): void {
  if (!existsSync(path)) return
  const external = extractMemory(readFileSync(path, 'utf-8'))
  const ours = readMemoryContent().trim()
  if (!external || external === ours) return
  writeMemoryContent(external)
  broadcastMemoryChanged()
}

export function refreshMemoryWatchers(): void {
  for (const { path } of providerMemoryPaths()) {
    if (watchers.has(path)) continue
    try {
      watchers.set(
        path,
        watch(path, () => {
          pending.add(path)
          if (debounce) clearTimeout(debounce)
          debounce = setTimeout(() => {
            const paths = Array.from(pending)
            pending.clear()
            for (const changedPath of paths) importIfChanged(changedPath)
          }, 300)
        })
      )
    } catch {
      // provider file may not be watchable — skip
    }
  }
}
