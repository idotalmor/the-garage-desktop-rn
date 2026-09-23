import { app, BrowserWindow } from 'electron'
import { existsSync, readdirSync, readFileSync, statSync, watch, type FSWatcher } from 'fs'
import { basename, join, resolve } from 'path'
import { IntegrationChannel } from '../../shared/integrations/channels'
import type { SessionDetail, SessionMessage, SessionSummary } from '../../shared/integrations/types'
import { SESSIONS_INBOX_DIR } from './store'

const HOME = app.getPath('home')

type Source = {
  provider: string
  dir: string
  ext: string
}

const SOURCES: Source[] = [
  { provider: 'claude-code', dir: join(HOME, '.claude', 'projects'), ext: '.jsonl' },
  { provider: 'codex', dir: join(HOME, '.codex', 'sessions'), ext: '.jsonl' },
  { provider: 'gemini', dir: join(HOME, '.gemini', 'tmp'), ext: '.json' },
  { provider: 'hook', dir: SESSIONS_INBOX_DIR, ext: '.jsonl' }
]

function listFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return []
  try {
    return readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(ext))
      .map((entry) => join(entry.parentPath, entry.name))
  } catch {
    return []
  }
}

function parseJson(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line) as Record<string, unknown>
  } catch {
    return null
  }
}

function extractClaudeMessage(record: Record<string, unknown>): SessionMessage | null {
  const type = record.type
  if (type !== 'user' && type !== 'assistant') return null
  const message = record.message as { content?: unknown } | undefined
  const content = message?.content
  let text = ''
  if (typeof content === 'string') text = content
  else if (Array.isArray(content)) {
    text = content
      .filter((block) => (block as { type?: string }).type === 'text')
      .map((block) => String((block as { text?: string }).text ?? ''))
      .join('\n')
  }
  if (!text.trim()) return null
  return { role: type, text: text.trim(), timestamp: String(record.timestamp ?? '') }
}

function extractCodexMessage(record: Record<string, unknown>): SessionMessage | null {
  const payload = record.payload as Record<string, unknown> | undefined
  if (record.type !== 'response_item' || payload?.type !== 'message') return null
  const content = payload.content
  const role = String(payload.role ?? 'unknown')
  let text = ''
  if (Array.isArray(content)) {
    text = content.map((block) => String((block as { text?: string }).text ?? '')).join('\n')
  }
  if (!text.trim()) return null
  return { role, text: text.trim(), timestamp: String(record.timestamp ?? '') }
}

function readJsonl(path: string): Record<string, unknown>[] {
  try {
    return readFileSync(path, 'utf-8')
      .split('\n')
      .map(parseJson)
      .filter((record): record is Record<string, unknown> => record !== null)
  } catch {
    return []
  }
}

function parseSession(source: Source, path: string): SessionDetail | null {
  try {
    const stats = statSync(path)
    const messages: SessionMessage[] = []
    let project = ''
    let startedAt = ''

    if (source.provider === 'gemini') {
      const data = parseJson(readFileSync(path, 'utf-8'))
      const rawMessages = (data?.messages ?? []) as Record<string, unknown>[]
      for (const message of rawMessages) {
        const type = String(message.type ?? '')
        if (type !== 'user' && type !== 'gemini') continue
        const content = message.content
        const text = Array.isArray(content)
          ? content.map((block) => String((block as { text?: string }).text ?? '')).join('\n')
          : String(content ?? '')
        if (text.trim()) {
          messages.push({
            role: type === 'gemini' ? 'assistant' : 'user',
            text: text.trim(),
            timestamp: String(message.timestamp ?? '')
          })
        }
      }
      project = basename(join(path, '..', '..'))
      startedAt = messages[0]?.timestamp ?? stats.mtime.toISOString()
    } else {
      const records = readJsonl(path)
      for (const record of records) {
        if (!startedAt && record.timestamp) startedAt = String(record.timestamp)
        if (source.provider === 'claude-code') {
          if (!project && record.cwd) project = basename(String(record.cwd))
          const message = extractClaudeMessage(record)
          if (message) messages.push(message)
        } else if (source.provider === 'codex') {
          const payload = record.payload as Record<string, unknown> | undefined
          if (record.type === 'session_meta' && payload?.cwd)
            project = basename(String(payload.cwd))
          const message = extractCodexMessage(record)
          if (message) messages.push(message)
        } else {
          messages.push({
            role: 'event',
            text: JSON.stringify(record).slice(0, 500),
            timestamp: String(record.timestamp ?? '')
          })
        }
      }
    }

    const firstUser = messages.find((message) => message.role === 'user')
    const title = firstUser?.text.split('\n')[0].slice(0, 80) || basename(path)

    return {
      id: `${source.provider}:${path}`,
      provider: source.provider,
      project: project || basename(join(path, '..')),
      title,
      startedAt: startedAt || stats.mtime.toISOString(),
      messageCount: messages.length,
      path,
      messages
    }
  } catch {
    return null
  }
}

export function listSessions(): SessionSummary[] {
  return SOURCES.flatMap((source) =>
    listFiles(source.dir, source.ext)
      .map((path) => parseSession(source, path))
      .filter((session): session is SessionDetail => session !== null && session.messageCount > 0)
      .map((session) => ({
        id: session.id,
        provider: session.provider,
        project: session.project,
        title: session.title,
        startedAt: session.startedAt,
        messageCount: session.messageCount,
        path: session.path
      }))
  ).sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

export function getSession(id: string): SessionDetail | null {
  const separator = id.indexOf(':')
  if (separator < 0) return null
  const provider = id.slice(0, separator)
  const path = resolve(id.slice(separator + 1))
  const source = SOURCES.find((item) => item.provider === provider)
  if (!source || !path.startsWith(resolve(source.dir)) || !existsSync(path)) return null
  return parseSession(source, path)
}

const watchers: FSWatcher[] = []
let debounce: ReturnType<typeof setTimeout> | null = null

function broadcastSessionsChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IntegrationChannel.SessionsChanged)
  }
}

export function watchSessionSources(): void {
  for (const source of SOURCES) {
    if (!existsSync(source.dir)) continue
    try {
      watchers.push(
        watch(source.dir, { recursive: true }, () => {
          if (debounce) clearTimeout(debounce)
          debounce = setTimeout(broadcastSessionsChanged, 400)
        })
      )
    } catch {
      // fs.watch recursive is unsupported for some dirs — skip
    }
  }
}
