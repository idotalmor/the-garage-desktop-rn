import {
  Bell,
  Bot,
  CircleDot,
  FileText,
  GitBranch,
  MessageCircle,
  Search,
  Terminal,
  UserRound,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@heroui/react'
import { PromptInput, Widget } from '@heroui-pro/react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { CiBadge } from './CiBadge'
import { favoritePeople } from './repository-cards'
import { GitHubSettingsModal } from './GitHubSettingsModal'

function getSearchTerms(prompt: string): string[] {
  const stop = new Set(
    'a an and are as at be by for from has he in is it its me my of on or pr prs that the this to was what when where which who why with find search give show'.split(
      ' '
    )
  )
  return prompt
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stop.has(word))
}

export function GitHubPage(): React.JSX.Element {
  const [searchPrompt, setSearchPrompt] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [spyInput, setSpyInput] = useState('')
  const [spies, setSpies] = useState<string[]>(['editor installation'])
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'others'>('all')
  const [activePromptTab, setActivePromptTab] = useState<'find' | 'watch'>('find')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'people' | 'slack'>('people')
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const searchTerms = useMemo(() => getSearchTerms(searchQuery), [searchQuery])

  const addSpy = (): void => {
    const value = spyInput.trim()
    if (value && !spies.includes(value)) setSpies([...spies, value])
    setSpyInput('')
  }
  const openContext = (): void => {
    window.open('?view=artifactory', '_blank', 'width=900,height=600')
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-8 pt-14 sm:px-5 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow={
            <span className="flex items-center gap-1">
              <CircleDot size={12} /> Git workspace
            </span>
          }
          title="Review queue"
          description="Pull requests, CI signals, local worktrees, and lightweight review workflows."
        />
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" className="rounded-lg" onPress={() => {}}>
            <GitBranch size={15} /> Connect to Git
          </Button>
          <Button
            isIconOnly
            variant="outline"
            size="sm"
            aria-label="Git workspace notifications"
            onPress={() => {}}
          >
            <Bell size={16} />
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg" onPress={openContext}>
            <FileText size={15} /> Context
          </Button>
          <div className="flex gap-1.5">
            <CiBadge status="passing" />
            <CiBadge status="in-progress" />
            <CiBadge status="failing" />
          </div>
        </div>
      </header>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(['all', 'mine', 'others'] as const).map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={activeFilter === filter ? 'primary' : 'outline'}
              className="rounded-lg text-xs capitalize"
              onPress={() => setActiveFilter(filter)}
            >
              {filter === 'all' ? 'All PRs' : filter === 'mine' ? 'Mine' : 'Others'}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <UserRound size={14} /> Current person:{' '}
          <span className="font-medium text-foreground">{selectedPerson ?? 'You'}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-lg text-xs"
            onPress={() => {
              setSettingsTab('people')
              setIsSettingsOpen(true)
            }}
          >
            Choose
          </Button>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <Widget>
          <Widget.Header>
            <Widget.Title>Ask the Git workspace</Widget.Title>
            <Widget.Description>
              Find PRs or watch for new ones matching a topic.
            </Widget.Description>
          </Widget.Header>
          <Widget.Content className="p-3">
            <div className="mb-3 flex gap-1 rounded-lg border border-border p-1">
              <Button
                size="sm"
                variant={activePromptTab === 'find' ? 'primary' : 'ghost'}
                className="flex-1 rounded-md text-xs"
                onPress={() => setActivePromptTab('find')}
              >
                Find PRs
              </Button>
              <Button
                size="sm"
                variant={activePromptTab === 'watch' ? 'primary' : 'ghost'}
                className="flex-1 rounded-md text-xs"
                onPress={() => setActivePromptTab('watch')}
              >
                Watch topics
              </Button>
            </div>
            <PromptInput
              value={activePromptTab === 'find' ? searchPrompt : spyInput}
              onValueChange={activePromptTab === 'find' ? setSearchPrompt : setSpyInput}
              onSubmit={() =>
                activePromptTab === 'find' ? setSearchQuery(searchPrompt.trim()) : addSpy()
              }
            >
              <PromptInput.Shell className="border border-border shadow-none">
                <PromptInput.Content>
                  <PromptInput.TextArea
                    className="min-h-10"
                    placeholder={
                      activePromptTab === 'find'
                        ? 'Find PRs about editor installation...'
                        : 'Watch for new PR topics...'
                    }
                  />
                </PromptInput.Content>
                <PromptInput.Toolbar>
                  <PromptInput.ToolbarStart>
                    <span className="text-xs text-muted">
                      {activePromptTab === 'find'
                        ? searchTerms.length
                          ? `Matching ${searchTerms.join(', ')}`
                          : 'Natural-language search'
                        : 'Spy list for new PRs'}
                    </span>
                  </PromptInput.ToolbarStart>
                  <PromptInput.ToolbarEnd>
                    <PromptInput.Send
                      isDisabled={
                        activePromptTab === 'find' ? !searchPrompt.trim() : !spyInput.trim()
                      }
                      aria-label={activePromptTab === 'find' ? 'Find PRs' : 'Add spy'}
                    >
                      {activePromptTab === 'find' ? <Search size={15} /> : <Bell size={15} />}
                    </PromptInput.Send>
                  </PromptInput.ToolbarEnd>
                </PromptInput.Toolbar>
              </PromptInput.Shell>
            </PromptInput>
            {activePromptTab === 'find' && searchQuery && (
              <p className="mt-2 text-xs text-muted" role="status">
                Searching for: {searchQuery}
              </p>
            )}
            {activePromptTab === 'watch' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {spies.map((spy) => (
                  <span
                    key={spy}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs"
                  >
                    {spy}
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      className="size-4 min-h-4 rounded-full p-0"
                      onPress={() => setSpies(spies.filter((item) => item !== spy))}
                      aria-label={`Remove ${spy}`}
                    >
                      <X size={10} />
                    </Button>
                  </span>
                ))}
              </div>
            )}
          </Widget.Content>
        </Widget>
        <Widget>
          <Widget.Header>
            <Widget.Title>Automations</Widget.Title>
            <Widget.Description>
              Mock HTTP triggers with injected PR data preview.
            </Widget.Description>
          </Widget.Header>
          <Widget.Content className="space-y-2 p-3">
            <AutomationButton icon={<Bot size={13} />} label="Rerun CI" />
            <AutomationButton icon={<MessageCircle size={13} />} label="Notify Slack" />
            <AutomationButton icon={<Terminal size={13} />} label="Run lint" />
            <textarea
              readOnly
              value={
                '{\n  "prLink": "https://github.com/acme/platform-api/pull/184",\n  "repository": "platform-api",\n  "author": "Maya Chen"\n}'
              }
              aria-label="Injected automation payload preview"
              className="mt-2 h-24 w-full rounded-lg border border-border bg-surface-secondary p-2 font-mono text-[11px] text-foreground outline-none"
            />
          </Widget.Content>
        </Widget>
      </div>

      <GitHubSettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsTab}
        favoritePeople={favoritePeople}
        defaultSlackChannel="#eng-review"
        onClose={() => setIsSettingsOpen(false)}
        onSelectPerson={setSelectedPerson}
      />
    </main>
  )
}

function AutomationButton({
  icon,
  label
}: {
  icon: React.ReactNode
  label: string
}): React.JSX.Element {
  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full justify-start rounded-lg text-xs"
      onPress={() => {}}
    >
      {icon}
      {label}
      <span className="ml-auto text-[10px] text-muted">HTTP mock</span>
    </Button>
  )
}
