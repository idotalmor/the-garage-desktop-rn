import { Check, Download, Plus, RefreshCw, Send, Sparkles, Wrench, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Chip } from '@heroui/react'
import { IntegrationChannel } from '../../../../../shared/integrations/channels'
import type {
  ChatMessage,
  MemoryState,
  ProviderStatus
} from '../../../../../shared/integrations/types'

const mcpTools = ['memory_read', 'memory_write', 'memory_append', 'memory_search']

function serializeItems(items: string[]): string {
  return `# Memory\n\n${items.map((item) => `- ${item}`).join('\n')}\n`
}

function extractMemoryProposal(text: string): string | null {
  const match = text.match(/<memory>([\s\S]*?)<\/memory>/)
  return match ? match[1].trim() : null
}

function proposalToItems(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean)
}

export function MemoryTab(): React.JSX.Element {
  const [memory, setMemory] = useState<MemoryState | null>(null)
  const [draft, setDraft] = useState('')
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [hasKey, setHasKey] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatError, setChatError] = useState('')
  const [proposal, setProposal] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [state, providerList, keyConfigured] = await Promise.all([
      window.electron.ipcRenderer.invoke(IntegrationChannel.MemoryGet),
      window.electron.ipcRenderer.invoke(IntegrationChannel.ProvidersList),
      window.electron.ipcRenderer.invoke(IntegrationChannel.HasApiKey)
    ])
    setMemory(state as MemoryState)
    setProviders(providerList as ProviderStatus[])
    setHasKey(Boolean(keyConfigured))
  }, [])

  useEffect(() => {
    const onChanged = (): void => void load()
    window.electron.ipcRenderer.on(IntegrationChannel.MemoryChanged, onChanged)
    queueMicrotask(load)
    return () => {
      window.electron.ipcRenderer.removeListener(IntegrationChannel.MemoryChanged, onChanged)
    }
  }, [load])

  const saveItems = async (items: string[]): Promise<void> => {
    const state = (await window.electron.ipcRenderer.invoke(
      IntegrationChannel.MemorySave,
      serializeItems(items)
    )) as MemoryState
    setMemory(state)
  }

  const addItem = (): void => {
    const text = draft.trim()
    if (!text || !memory) return
    setDraft('')
    void saveItems([...memory.items, text])
  }

  const syncMemory = async (items?: string[]): Promise<void> => {
    const content = serializeItems(items ?? memory?.items ?? [])
    const state = (await window.electron.ipcRenderer.invoke(
      IntegrationChannel.MemorySync,
      content
    )) as MemoryState
    setMemory(state)
    setProviders(
      (await window.electron.ipcRenderer.invoke(
        IntegrationChannel.ProvidersList
      )) as ProviderStatus[]
    )
  }

  const toggleProvider = async (provider: ProviderStatus): Promise<void> => {
    setProviders(
      (await window.electron.ipcRenderer.invoke(IntegrationChannel.ProviderSetInstalled, {
        id: provider.id,
        installed: !provider.installed
      })) as ProviderStatus[]
    )
    await load()
  }

  const saveApiKey = async (): Promise<void> => {
    const configured = await window.electron.ipcRenderer.invoke(
      IntegrationChannel.SetApiKey,
      apiKey
    )
    setHasKey(Boolean(configured))
    setApiKey('')
  }

  const sendMessage = async (): Promise<void> => {
    const text = chatInput.trim()
    if (!text || isSending) return
    const next = [...messages, { role: 'user' as const, text }]
    setMessages(next)
    setChatInput('')
    setIsSending(true)
    setChatError('')
    try {
      const reply = (await window.electron.ipcRenderer.invoke(
        IntegrationChannel.MemoryChat,
        next
      )) as string
      setMessages([...next, { role: 'assistant', text: reply }])
      const memoryProposal = extractMemoryProposal(reply)
      if (memoryProposal) setProposal(memoryProposal)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('missing-api-key')) {
        setHasKey(false)
        setChatError('Set an Anthropic API key to chat about your memory.')
      } else {
        setChatError(message)
      }
    } finally {
      setIsSending(false)
    }
  }

  const items = memory?.items ?? []

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <Card>
          <Card.Header className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Card.Title>Your memory</Card.Title>
                <Card.Description>Facts and preferences every agent can use.</Card.Description>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 rounded-lg"
                onPress={() => void syncMemory()}
                isDisabled={!memory}
              >
                <RefreshCw size={13} aria-hidden="true" />
                Save &amp; sync
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="px-5 pb-5">
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addItem()
                }}
                placeholder="e.g. I prefer short PR descriptions"
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-foreground outline-none"
                aria-label="New memory"
              />
              <Button
                size="sm"
                variant="primary"
                className="rounded-lg"
                onPress={addItem}
                isDisabled={!draft.trim()}
              >
                <Plus size={15} aria-hidden="true" />
                Add
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {items.length === 0 ? (
                <p className="py-2 text-xs text-muted">Nothing saved yet.</p>
              ) : (
                items.map((item, index) => (
                  <div
                    key={`${index}-${item}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface-secondary px-3 py-2"
                  >
                    <p className="min-w-0 flex-1 text-xs text-foreground">{item}</p>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      className="size-6 shrink-0 rounded-md text-muted"
                      onPress={() => void saveItems(items.filter((_, i) => i !== index))}
                      aria-label="Remove memory"
                    >
                      <X size={13} aria-hidden="true" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="p-5">
            <Card.Title className="flex items-center gap-2">
              <Sparkles size={14} aria-hidden="true" /> Improve with AI
            </Card.Title>
            <Card.Description>
              Chat to refine your memory, then apply and sync the result.
            </Card.Description>
          </Card.Header>
          <Card.Content className="px-5 pb-5">
            {!hasKey ? (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Anthropic API key"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-foreground outline-none"
                  aria-label="Anthropic API key"
                />
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-lg"
                  onPress={() => void saveApiKey()}
                  isDisabled={!apiKey.trim()}
                >
                  Save key
                </Button>
              </div>
            ) : (
              <>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {messages.length === 0 && (
                    <p className="py-1 text-xs text-muted">
                      Ask things like &ldquo;merge duplicate entries&rdquo; or &ldquo;add that I
                      work in TypeScript&rdquo;.
                    </p>
                  )}
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`rounded-lg px-3 py-2 text-xs ${
                        message.role === 'user'
                          ? 'ml-8 bg-accent/10 text-foreground'
                          : 'mr-8 bg-surface-secondary text-foreground'
                      }`}
                    >
                      {message.text.replace(/<memory>[\s\S]*?<\/memory>/, '[proposed memory]')}
                    </div>
                  ))}
                  {isSending && <p className="text-xs text-muted">Thinking…</p>}
                  {chatError && <p className="text-xs text-danger">{chatError}</p>}
                </div>
                {proposal && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2">
                    <p className="text-xs text-foreground">
                      Improved memory ready ({proposalToItems(proposal).length} items)
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      className="shrink-0 rounded-lg"
                      onPress={() => {
                        const next = proposalToItems(proposal)
                        setProposal(null)
                        void syncMemory(next)
                      }}
                    >
                      <Check size={13} aria-hidden="true" />
                      Apply &amp; sync
                    </Button>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void sendMessage()
                    }}
                    placeholder="How should your memory change?"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-foreground outline-none"
                    aria-label="Chat about memory"
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="primary"
                    className="rounded-lg"
                    onPress={() => void sendMessage()}
                    isDisabled={!chatInput.trim() || isSending}
                    aria-label="Send"
                  >
                    <Send size={14} aria-hidden="true" />
                  </Button>
                </div>
              </>
            )}
          </Card.Content>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <Card.Header className="p-5">
            <Card.Title>Install in providers</Card.Title>
            <Card.Description>Expose this memory and tools over MCP.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-2 px-5 pb-5">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium">{provider.name}</p>
                  <p className="truncate text-[11px] text-muted">{provider.detail}</p>
                </div>
                {provider.installed ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 rounded-lg text-success"
                    onPress={() => void toggleProvider(provider)}
                  >
                    <Check size={13} aria-hidden="true" />
                    Installed
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-lg"
                    onPress={() => void toggleProvider(provider)}
                  >
                    <Download size={13} aria-hidden="true" />
                    Install
                  </Button>
                )}
              </div>
            ))}
            {memory && memory.syncedProviders.length > 0 && (
              <p className="pt-1 text-[11px] text-muted">
                Memory synced to: {memory.syncedProviders.join(', ')}
              </p>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="p-5">
            <Card.Title className="flex items-center gap-2">
              <Wrench size={14} aria-hidden="true" /> MCP tools
            </Card.Title>
            <Card.Description>Tools every provider gets on install.</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-wrap gap-1.5 px-5 pb-5">
            {mcpTools.map((tool) => (
              <Chip key={tool} size="sm" variant="soft">
                {tool}
              </Chip>
            ))}
          </Card.Content>
        </Card>
      </div>
    </section>
  )
}
