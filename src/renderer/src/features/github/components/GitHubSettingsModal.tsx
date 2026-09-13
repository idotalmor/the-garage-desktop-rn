import { X } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '@heroui/react'

type GitHubSettingsModalProps = {
  isOpen: boolean
  initialTab: 'people' | 'slack'
  favoritePeople: string[]
  defaultSlackChannel?: string
  onClose: () => void
  onSelectPerson?: (person: string) => void
}

export function GitHubSettingsModal({
  isOpen,
  initialTab,
  favoritePeople,
  defaultSlackChannel,
  onClose,
  onSelectPerson
}: GitHubSettingsModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'people' | 'slack'>(initialTab)
  const [channel, setChannel] = useState(defaultSlackChannel ?? '')

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className="w-full max-w-md border border-border bg-surface p-0"
        onClick={(event) => event.stopPropagation()}
      >
        <Card.Header className="flex items-center justify-between border-b border-separator px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Git workspace settings</h3>
            <p className="text-[11px] text-muted">Favorites and default channels</p>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-6 rounded-full"
            onPress={onClose}
            aria-label="Close"
          >
            <X size={14} aria-hidden="true" />
          </Button>
        </Card.Header>
        <Card.Content className="p-4">
          <div className="flex gap-1 rounded-lg border border-border p-1">
            <Button
              size="sm"
              variant={activeTab === 'people' ? 'primary' : 'ghost'}
              className="flex-1 rounded-md text-xs"
              onPress={() => setActiveTab('people')}
            >
              People
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'slack' ? 'primary' : 'ghost'}
              className="flex-1 rounded-md text-xs"
              onPress={() => setActiveTab('slack')}
            >
              Slack
            </Button>
          </div>

          {activeTab === 'people' && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted">
                Favorite people appear first in search and review menus.
              </p>
              {favoritePeople.map((person) => (
                <Button
                  key={person}
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start rounded-lg text-xs"
                  onPress={() => {
                    onSelectPerson?.(person)
                    onClose()
                  }}
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-surface-secondary text-[11px] font-semibold text-foreground">
                    {person.charAt(0)}
                  </span>
                  {person}
                </Button>
              ))}
            </div>
          )}

          {activeTab === 'slack' && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted">Default channel for review requests.</p>
              <input
                type="text"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                placeholder="#eng-review"
                className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-foreground outline-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-lg text-xs"
                  onPress={onClose}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
