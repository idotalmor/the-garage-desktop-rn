import { getApiKey } from './store'
import type { ChatMessage } from '../../shared/integrations/types'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

type AnthropicResponse = {
  content?: { type: string; text?: string }[]
  error?: { message?: string }
}

export async function memoryChat(messages: ChatMessage[], memory: string): Promise<string> {
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
        'You help the user refine their shared agent memory — a short markdown bullet list of facts and preferences that is synced into every AI provider they use.',
        'The current memory is:',
        memory || '(empty)',
        'When you produce a revised memory, output ONLY the complete new bullet list inside <memory>...</memory> tags. For anything else, reply conversationally and briefly.'
      ].join('\n'),
      messages: messages.map((message) => ({ role: message.role, content: message.text }))
    })
  })

  const data = (await response.json()) as AnthropicResponse
  if (!response.ok) throw new Error(data.error?.message ?? `anthropic:${response.status}`)
  return (
    data.content
      ?.filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('') ?? ''
  )
}
