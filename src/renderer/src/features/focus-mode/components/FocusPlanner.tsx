import { SendHorizontal, Sparkles } from 'lucide-react'
import { Button } from '@heroui/react'
import { useState } from 'react'
import type { FocusPlanTimer } from '../../../../../shared/focus-mode/types'
import type { ChatMessage } from '../../../../../shared/integrations/types'
import { formatElapsed, formatTime } from '../utils'

type FocusPlannerProps = {
  onPlan: (messages: ChatMessage[]) => Promise<{ text: string; plan: FocusPlanTimer[] | null }>
  onSchedule: (timers: FocusPlanTimer[]) => void
}

export function FocusPlanner({ onPlan, onSchedule }: FocusPlannerProps): React.JSX.Element {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [plan, setPlan] = useState<FocusPlanTimer[] | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async (): Promise<void> => {
    const text = input.trim()
    if (!text || isPending) return
    setInput('')
    setError(null)
    const next: ChatMessage[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setIsPending(true)
    try {
      const result = await onPlan(next)
      if (result.plan) setPlan(result.plan)
      if (result.text) setMessages([...next, { role: 'assistant', text: result.text }])
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'missing-api-key'
          ? 'Add your Anthropic API key in Integrations to use the planner.'
          : 'Something went wrong — try again.'
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section
      className="mt-3 rounded-xl border border-border bg-surface/80 p-3 backdrop-blur-sm"
      aria-label="Plan your focus"
    >
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Sparkles size={15} aria-hidden="true" /> Plan your focus
      </span>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe your tasks and I'll schedule them..."
          aria-label="Describe your tasks"
          className="min-w-0 flex-1 rounded-md bg-surface-secondary px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted"
          onKeyDown={(event) => {
            if (event.key === 'Enter') void send()
          }}
        />
        <Button
          isIconOnly
          size="sm"
          variant="secondary"
          onPress={() => void send()}
          isDisabled={isPending || !input.trim()}
          aria-label="Send to planner"
        >
          <SendHorizontal size={14} aria-hidden="true" />
        </Button>
      </div>

      {messages.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {messages.map((message, index) => (
            <p
              key={index}
              className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs ${
                message.role === 'user'
                  ? 'self-end bg-accent/15 text-foreground'
                  : 'self-start bg-surface-secondary text-muted'
              }`}
            >
              {message.text}
            </p>
          ))}
          {isPending && <p className="self-start text-xs text-muted">Thinking…</p>}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {plan && (
        <div className="mt-3 rounded-lg border border-success/30 bg-success/5 p-2.5">
          <p className="text-xs font-medium text-foreground">Proposed plan</p>
          <ul className="mt-1.5 space-y-1">
            {plan.map((timer, index) => (
              <li key={index} className="flex items-center gap-2 text-xs text-muted">
                <span className="min-w-0 flex-1 truncate text-foreground">{timer.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatTime(timer.startsAt)} · {formatElapsed(timer.durationMs)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onPress={() => setPlan(null)}>
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                onSchedule(plan)
                setPlan(null)
              }}
            >
              Create timers
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
