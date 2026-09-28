import type { ChatMessage } from '../shared/integrations/types'
import type { FocusPlanResult, FocusPlanTimer } from '../shared/focus-mode/types'
import { getApiKey } from './integrations/store'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_PLAN_TIMERS = 10
const MAX_DURATION_MINUTES = 12 * 60
const MAX_START_IN_MINUTES = 7 * 24 * 60

type AnthropicResponse = {
  content?: { type: string; text?: string }[]
  error?: { message?: string }
}

type RawPlanItem = { name?: unknown; durationMinutes?: unknown; startInMinutes?: unknown }

function parsePlan(text: string): FocusPlanTimer[] | null {
  const match = text.match(/<plan>([\s\S]*?)<\/plan>/)
  if (!match) return null
  try {
    const raw = JSON.parse(match[1]) as unknown
    if (!Array.isArray(raw)) return null
    const now = Date.now()
    const timers: FocusPlanTimer[] = []
    for (const item of raw.slice(0, MAX_PLAN_TIMERS)) {
      const entry = item as RawPlanItem
      const name = typeof entry.name === 'string' ? entry.name.trim() : ''
      const duration = Number(entry.durationMinutes)
      const startIn = Number(entry.startInMinutes)
      if (!name || !Number.isFinite(duration) || duration <= 0 || duration > MAX_DURATION_MINUTES) {
        continue
      }
      if (!Number.isFinite(startIn) || startIn < 0 || startIn > MAX_START_IN_MINUTES) continue
      timers.push({
        name,
        durationMs: Math.round(duration * 60_000),
        startsAt: now + Math.round(startIn * 60_000)
      })
    }
    return timers.length > 0 ? timers : null
  } catch {
    return null
  }
}

export async function planFocusSession(messages: ChatMessage[]): Promise<FocusPlanResult> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('missing-api-key')

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: [
        'You help the user plan focus timers for their tasks.',
        `Current local time: ${new Date().toLocaleString()}.`,
        'Discuss briefly, ask at most one clarifying question at a time, and when the schedule is clear propose it by outputting a <plan> JSON array on its own line.',
        'Each item is {"name": string, "durationMinutes": number, "startInMinutes": number} where startInMinutes is the offset from right now (0 = immediately).',
        'Keep replies short and conversational. When revising a proposal, output the complete new <plan> again.',
        'Example plan: <plan>[{"name":"Write report","durationMinutes":120,"startInMinutes":0},{"name":"Review PRs","durationMinutes":240,"startInMinutes":120}]</plan>'
      ].join('\n'),
      messages: messages.map((message) => ({ role: message.role, content: message.text }))
    })
  })

  const data = (await response.json()) as AnthropicResponse
  if (!response.ok) throw new Error(data.error?.message ?? `anthropic:${response.status}`)
  const raw =
    data.content
      ?.filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('') ?? ''

  return {
    text: raw.replace(/<plan>[\s\S]*?<\/plan>/, '').trim(),
    plan: parsePlan(raw)
  }
}
