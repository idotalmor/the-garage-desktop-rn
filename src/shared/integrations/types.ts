export type ProviderId = 'claude' | 'cursor' | 'windsurf' | 'gemini' | 'codex'

export type ProviderStatus = {
  id: ProviderId
  name: string
  detail: string
  installed: boolean
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
}

export type MemoryState = {
  items: string[]
  content: string
  syncedProviders: ProviderId[]
}

export type SessionSummary = {
  id: string
  provider: string
  project: string
  title: string
  startedAt: string
  messageCount: number
  path: string
}

export type SessionMessage = {
  role: string
  text: string
  timestamp?: string
}

export type SessionDetail = SessionSummary & {
  messages: SessionMessage[]
}
