import { ArrowLeft, Terminal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Chip } from '@heroui/react'
import { IntegrationChannel } from '../../../../../shared/integrations/channels'
import type { SessionDetail, SessionSummary } from '../../../../../shared/integrations/types'

export function SessionsTab(): React.JSX.Element {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [providerFilter, setProviderFilter] = useState('all')
  const [selected, setSelected] = useState<SessionDetail | null>(null)

  const load = useCallback(async () => {
    setSessions(
      (await window.electron.ipcRenderer.invoke(
        IntegrationChannel.SessionsList
      )) as SessionSummary[]
    )
  }, [])

  useEffect(() => {
    const onChanged = (): void => void load()
    window.electron.ipcRenderer.on(IntegrationChannel.SessionsChanged, onChanged)
    queueMicrotask(load)
    return () => {
      window.electron.ipcRenderer.removeListener(IntegrationChannel.SessionsChanged, onChanged)
    }
  }, [load])

  const providers = useMemo(
    () => Array.from(new Set(sessions.map((session) => session.provider))),
    [sessions]
  )

  const filtered = useMemo(
    () =>
      providerFilter === 'all'
        ? sessions
        : sessions.filter((session) => session.provider === providerFilter),
    [sessions, providerFilter]
  )

  const openSession = async (id: string): Promise<void> => {
    setSelected(
      (await window.electron.ipcRenderer.invoke(
        IntegrationChannel.SessionGet,
        id
      )) as SessionDetail | null
    )
  }

  if (selected) {
    return (
      <Card>
        <Card.Header className="p-5">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="rounded-lg text-muted"
              onPress={() => setSelected(null)}
              aria-label="Back to sessions"
            >
              <ArrowLeft size={15} aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <Card.Title className="truncate">{selected.title}</Card.Title>
              <Card.Description>
                {selected.project} · {new Date(selected.startedAt).toLocaleString()}
              </Card.Description>
            </div>
            <Chip size="sm" variant="soft" className="ml-auto shrink-0">
              {selected.provider}
            </Chip>
          </div>
        </Card.Header>
        <Card.Content className="space-y-2 px-5 pb-5">
          {selected.messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-lg px-3 py-2 text-xs leading-5 ${
                message.role === 'user'
                  ? 'ml-8 bg-accent/10 text-foreground'
                  : 'mr-8 bg-surface-secondary text-foreground'
              }`}
            >
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                {message.role}
              </p>
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            </div>
          ))}
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card>
      <Card.Header className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Card.Title>Captured sessions</Card.Title>
            <Card.Description>
              Conversations watched from provider transcripts and hooks.
            </Card.Description>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['all', ...providers].map((provider) => (
              <Chip
                key={provider}
                size="sm"
                variant={providerFilter === provider ? 'primary' : 'soft'}
                className="cursor-pointer"
                onClick={() => setProviderFilter(provider)}
              >
                {provider}
              </Chip>
            ))}
          </div>
        </div>
      </Card.Header>
      <Card.Content className="space-y-2 px-5 pb-5">
        {filtered.length === 0 ? (
          <p className="py-4 text-xs text-muted">
            No sessions captured yet — Claude Code, Codex, and Gemini transcripts are watched
            automatically.
          </p>
        ) : (
          filtered.map((session) => (
            <button
              key={session.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
              onClick={() => void openSession(session.id)}
            >
              <Terminal size={14} aria-hidden="true" className="shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{session.title}</p>
                <p className="truncate text-[11px] text-muted">
                  {session.project} · {session.messageCount} messages ·{' '}
                  {new Date(session.startedAt).toLocaleString()}
                </p>
              </div>
              <Chip size="sm" variant="soft" className="shrink-0">
                {session.provider}
              </Chip>
            </button>
          ))
        )}
      </Card.Content>
    </Card>
  )
}
