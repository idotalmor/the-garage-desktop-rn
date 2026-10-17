import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { ensureMcpServer, MCP_SERVER_PATH } from './mcp-server'
import { ensureDirs, readMemoryContent } from './store'
import type { ProviderId, ProviderStatus } from '../../shared/integrations/types'

const HOME = app.getPath('home')

const BLOCK_START = '<!-- devflow:memory:start -->'
const BLOCK_END = '<!-- devflow:memory:end -->'

type ProviderDef = {
  id: ProviderId
  name: string
  detail: string
  mcpConfigPath: string | null
  memoryPath: string | null
  memoryMode: 'block' | 'file'
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    detail: '~/.claude.json + ~/.claude/CLAUDE.md',
    mcpConfigPath: join(HOME, '.claude.json'),
    memoryPath: join(HOME, '.claude', 'CLAUDE.md'),
    memoryMode: 'block'
  },
  {
    id: 'cursor',
    name: 'Cursor',
    detail: '~/.cursor/mcp.json + rules',
    mcpConfigPath: join(HOME, '.cursor', 'mcp.json'),
    memoryPath: join(HOME, '.cursor', 'rules', 'devflow-memory.mdc'),
    memoryMode: 'file'
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    detail: 'mcp_config.json + rules',
    mcpConfigPath: join(HOME, '.codeium', 'windsurf', 'mcp_config.json'),
    memoryPath: join(HOME, '.windsurf', 'rules', 'devflow-memory.md'),
    memoryMode: 'file'
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    detail: '~/.gemini/settings.json + GEMINI.md',
    mcpConfigPath: join(HOME, '.gemini', 'settings.json'),
    memoryPath: join(HOME, '.gemini', 'GEMINI.md'),
    memoryMode: 'block'
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    detail: '~/.codex/AGENTS.md',
    mcpConfigPath: null,
    memoryPath: join(HOME, '.codex', 'AGENTS.md'),
    memoryMode: 'block'
  }
]

function readJson(path: string): Record<string, unknown> {
  try {
    return existsSync(path)
      ? (JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function writeJson(path: string, value: Record<string, unknown>): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf-8')
}

function wrapMemory(content: string): string {
  return `${BLOCK_START}\n${content.trim()}\n${BLOCK_END}`
}

function writeMemoryBlock(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  const existing = existsSync(path) ? readFileSync(path, 'utf-8') : ''
  const start = existing.indexOf(BLOCK_START)
  const end = existing.indexOf(BLOCK_END)
  const block = wrapMemory(content)
  const next =
    start >= 0 && end > start
      ? existing.slice(0, start) + block + existing.slice(end + BLOCK_END.length)
      : existing.trimEnd() + (existing.trim() ? '\n\n' : '') + block + '\n'
  writeFileSync(path, next, 'utf-8')
}

function removeMemoryBlock(path: string): void {
  if (!existsSync(path)) return
  const existing = readFileSync(path, 'utf-8')
  const start = existing.indexOf(BLOCK_START)
  const end = existing.indexOf(BLOCK_END)
  if (start < 0 || end <= start) return
  const next = (existing.slice(0, start) + existing.slice(end + BLOCK_END.length)).trim() + '\n'
  writeFileSync(path, next, 'utf-8')
}

function memoryFileContent(content: string): string {
  return `---\ndescription: Garage shared memory\nalwaysApply: true\n---\n\n${content.trim()}\n`
}

export function isProviderInstalled(def: ProviderDef): boolean {
  if (def.mcpConfigPath && existsSync(def.mcpConfigPath)) {
    const config = readJson(def.mcpConfigPath)
    const servers = config.mcpServers as Record<string, unknown> | undefined
    if (servers?.devflow) return true
  }
  if (def.memoryPath && existsSync(def.memoryPath)) {
    if (def.memoryMode === 'file') return true
    return readFileSync(def.memoryPath, 'utf-8').includes(BLOCK_START)
  }
  return false
}

export function listProviders(): ProviderStatus[] {
  return PROVIDERS.map((def) => ({
    id: def.id,
    name: def.name,
    detail: def.detail,
    installed: isProviderInstalled(def)
  }))
}

export function setProviderInstalled(id: ProviderId, installed: boolean): ProviderStatus[] {
  const def = PROVIDERS.find((provider) => provider.id === id)
  if (!def) return listProviders()
  ensureDirs()

  if (installed) {
    ensureMcpServer()
    if (def.mcpConfigPath) {
      const config = readJson(def.mcpConfigPath)
      const servers = (config.mcpServers ?? {}) as Record<string, unknown>
      servers.devflow = { command: 'node', args: [MCP_SERVER_PATH] }
      config.mcpServers = servers
      writeJson(def.mcpConfigPath, config)
    }
    syncProviderMemory(def)
  } else {
    if (def.mcpConfigPath && existsSync(def.mcpConfigPath)) {
      const config = readJson(def.mcpConfigPath)
      const servers = (config.mcpServers ?? {}) as Record<string, unknown>
      delete servers.devflow
      config.mcpServers = servers
      writeJson(def.mcpConfigPath, config)
    }
    if (def.memoryPath) {
      if (def.memoryMode === 'file') rmSync(def.memoryPath, { force: true })
      else removeMemoryBlock(def.memoryPath)
    }
  }
  return listProviders()
}

function syncProviderMemory(def: ProviderDef): void {
  if (!def.memoryPath) return
  const content = readMemoryContent()
  if (def.memoryMode === 'file') {
    mkdirSync(dirname(def.memoryPath), { recursive: true })
    writeFileSync(def.memoryPath, memoryFileContent(content), 'utf-8')
  } else {
    writeMemoryBlock(def.memoryPath, content)
  }
}

export function syncMemoryToProviders(): ProviderId[] {
  return PROVIDERS.filter(isProviderInstalled)
    .map((def) => {
      syncProviderMemory(def)
      return def.id
    })
    .filter(Boolean)
}

export function providerMemoryPaths(): { id: ProviderId; path: string }[] {
  return PROVIDERS.filter((def) => def.memoryPath && isProviderInstalled(def)).map((def) => ({
    id: def.id,
    path: def.memoryPath as string
  }))
}
