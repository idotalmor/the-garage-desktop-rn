import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export const DEVFLOW_DIR = join(app.getPath('home'), '.devflow')
export const MEMORY_PATH = join(DEVFLOW_DIR, 'memory.md')
export const SESSIONS_DIR = join(DEVFLOW_DIR, 'sessions')
export const SESSIONS_INBOX_DIR = join(SESSIONS_DIR, 'inbox')
export const BIN_DIR = join(DEVFLOW_DIR, 'bin')
export const SETTINGS_PATH = join(DEVFLOW_DIR, 'settings.json')

const MEMORY_HEADER = '# Memory\n\n'

export function ensureDirs(): void {
  for (const dir of [DEVFLOW_DIR, SESSIONS_DIR, SESSIONS_INBOX_DIR, BIN_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

export function readMemoryContent(): string {
  try {
    return existsSync(MEMORY_PATH) ? readFileSync(MEMORY_PATH, 'utf-8') : ''
  } catch {
    return ''
  }
}

export function writeMemoryContent(content: string): void {
  ensureDirs()
  writeFileSync(MEMORY_PATH, content, 'utf-8')
}

export function readMemoryItems(): string[] {
  return readMemoryContent()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean)
}

export function writeMemoryItems(items: string[]): void {
  writeMemoryContent(MEMORY_HEADER + items.map((item) => `- ${item}`).join('\n') + '\n')
}

type Settings = { anthropicApiKey?: string }

function readSettings(): Settings {
  try {
    return existsSync(SETTINGS_PATH)
      ? (JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8')) as Settings)
      : {}
  } catch {
    return {}
  }
}

export function getApiKey(): string {
  return readSettings().anthropicApiKey ?? process.env.ANTHROPIC_API_KEY ?? ''
}

export function setApiKey(key: string): void {
  ensureDirs()
  writeFileSync(SETTINGS_PATH, JSON.stringify({ ...readSettings(), anthropicApiKey: key }), 'utf-8')
}
