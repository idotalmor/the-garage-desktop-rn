/** Desktop Git connection controls and a bounded, explicitly opened repo/favorites picker. */
import { Button, TextInput, ThemeProvider } from '@gravity-ui/uikit'
import { Button as HeaderButton } from '@heroui/react'
import { Gear } from '@gravity-ui/icons'
import '@gravity-ui/uikit/styles/styles.css'
import { useTheme } from 'next-themes'
import { useRef, useState } from 'react'
import type { GitSourceRepo } from '../../../../shared/git-sources/types'
import type { useGitSources } from './useGitSources'
import { openGitHubUrl } from './open-url'

export function GitSourcesSettingsButton({
  expanded,
  onToggle
}: {
  /** Whether the Git settings panel is visible. */
  expanded: boolean
  /** Toggle the settings panel without collapsing repo cards. */
  onToggle: () => void
}): React.JSX.Element {
  const label = expanded ? 'Hide Git settings' : 'Show Git settings'
  return (
    <HeaderButton
      isIconOnly
      size="sm"
      variant="ghost"
      className="flex size-7 min-h-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground"
      aria-label={label}
      aria-expanded={expanded}
      aria-controls="git-settings-panel"
      onPress={onToggle}
    >
      <Gear width={14} height={14} aria-hidden="true" />
    </HeaderButton>
  )
}

type Props = { connection: ReturnType<typeof useGitSources> }
export function GitSourcesPanel({ connection }: Props): React.JSX.Element {
  const { resolvedTheme } = useTheme()
  const { snapshot, error, busy, connect, cancel, disconnect, refresh, favorite, listRepos } =
    connection
  const [cloneUrl, setCloneUrl] = useState('')
  const [cloneBranch, setCloneBranch] = useState('')
  const [picker, setPicker] = useState<string | null>(null)
  const [repos, setRepos] = useState<GitSourceRepo[]>([])
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)
  const request = useRef(0)
  const load = async (sourceId: string, page: number): Promise<void> => {
    const generation = ++request.current
    setLoading(true)
    setPickerError(null)
    if (page === 1) {
      setPicker(sourceId)
      setRepos([])
      setNextPage(null)
      setQuery('')
    }
    try {
      const result = await listRepos(sourceId, page)
      if (generation !== request.current) return
      setRepos((current) =>
        page === 1
          ? result.repos
          : [
              ...new Map(
                [...current, ...result.repos].map((repo) => [repo.externalId, repo])
              ).values()
            ]
      )
      setNextPage(result.nextPage)
    } catch (error) {
      if (generation === request.current) setPickerError(String(error))
    } finally {
      if (generation === request.current) setLoading(false)
    }
  }
  const closePicker = (): void => {
    request.current++
    setPicker(null)
    setLoading(false)
  }
  const selected = new Set(snapshot?.favorites.map((repo) => `${repo.sourceId}/${repo.externalId}`))
  const source = snapshot?.sources.find((source) => source.id === picker)
  return (
    <ThemeProvider scoped theme={resolvedTheme === 'dark' ? 'dark' : 'light'}>
      <div className="space-y-3 rounded-lg border border-[var(--g-color-line-generic)] p-3 text-[var(--g-color-text-primary)]">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="s"
            view="outlined"
            loading={busy}
            disabled={!!snapshot?.authorization}
            onClick={() => void connect()}
          >
            Connect GitHub
          </Button>
          <span className="text-xs text-[var(--g-color-text-secondary)]">
            Your local repos + favorites. Connecting never adds every repo.
          </span>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!busy && cloneUrl.trim())
              void connection.createCheckout({
                repo: { kind: 'url', url: cloneUrl.trim() },
                branch: cloneBranch.trim() || null
              })
          }}
        >
          <div className="min-w-56 flex-1">
            <TextInput
              value={cloneUrl}
              onUpdate={setCloneUrl}
              placeholder="Paste a GitHub repo URL"
              aria-label="GitHub repo URL to clone"
              disabled={busy}
            />
          </div>
          <div className="w-44">
            <TextInput
              value={cloneBranch}
              onUpdate={setCloneBranch}
              placeholder="Branch (optional)"
              aria-label="Branch to check out (optional)"
              disabled={busy}
            />
          </div>
          <Button type="submit" size="s" view="outlined" disabled={busy || !cloneUrl.trim()}>
            Clone from URL
          </Button>
          <span className="text-xs text-[var(--g-color-text-secondary)]">
            Choose a parent folder next. Known repos reuse their local clone.
          </span>
        </form>
        {snapshot?.authorization && (
          <div role="status" className="space-y-2 text-sm">
            <p>
              Enter{' '}
              <strong className="select-all font-mono">{snapshot.authorization.userCode}</strong> on
              GitHub, then approve access. Waiting for authorization…
            </p>
            <div className="flex gap-2">
              <Button
                size="s"
                onClick={() => {
                  if (snapshot.authorization) openGitHubUrl(snapshot.authorization.verificationUri)
                }}
              >
                Open GitHub authorization
              </Button>
              <Button size="s" view="flat" onClick={() => void cancel()}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        {connection.checkoutPath && (
          <p role="status" className="break-all text-xs text-[var(--g-color-text-secondary)]">
            Checkout ready: {connection.checkoutPath}. Local cards update after scanning.
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-[var(--g-color-text-danger)]">
            {error}
          </p>
        )}
        {snapshot?.sources.map((account) => (
          <div key={account.id} className="flex flex-wrap items-center gap-2 text-xs">
            <span>GitHub · @{account.login}</span>
            <Button size="s" disabled={busy || loading} onClick={() => void load(account.id, 1)}>
              Choose favorites
            </Button>
            <Button size="s" view="flat" disabled={busy} onClick={() => void refresh(account.id)}>
              Refresh local + favorites
            </Button>
            <Button
              size="s"
              view="flat-danger"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `Disconnect @${account.login}? This removes its saved connection and favorites from this device, not local repos or GitHub data.`
                  )
                ) {
                  closePicker()
                  void disconnect(account.id)
                }
              }}
            >
              Disconnect
            </Button>
          </div>
        ))}
        {!!snapshot?.favorites.length && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span>Saved favorites:</span>
            {snapshot.favorites.map((saved) => {
              const repo = snapshot.repos.find(
                (repo) => repo.sourceId === saved.sourceId && repo.externalId === saved.externalId
              )
              return repo ? (
                <Button
                  key={`${saved.sourceId}/${saved.externalId}`}
                  size="s"
                  view="flat"
                  disabled={busy}
                  aria-label={`Unfavorite ${repo.fullName}`}
                  onClick={() => void favorite(saved.sourceId, saved.externalId, false)}
                >
                  {repo.fullName} · Remove favorite
                </Button>
              ) : null
            })}
          </div>
        )}
        {source && (
          <div className="space-y-2 border-t border-[var(--g-color-line-generic)] pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs">Favorites from @{source.login}</span>
              <Button size="s" view="flat" onClick={closePicker}>
                Close
              </Button>
            </div>
            <TextInput
              value={query}
              onUpdate={setQuery}
              placeholder="Filter loaded repos by owner/name"
              aria-label="Filter loaded GitHub repos"
            />
            <p className="text-xs text-[var(--g-color-text-secondary)]">
              Favorites are saved in The Garage, not GitHub stars. Load more to browse the rest of
              your account.
            </p>
            <div className="max-h-72 overflow-y-auto" aria-busy={loading}>
              {repos
                .filter((repo) => repo.fullName.toLowerCase().includes(query.toLowerCase()))
                .map((repo) => {
                  const isFavorite = selected.has(`${repo.sourceId}/${repo.externalId}`)
                  return (
                    <div key={repo.externalId} className="flex items-center gap-2 py-1 text-xs">
                      <Button
                        size="s"
                        selected={isFavorite}
                        disabled={busy}
                        aria-pressed={isFavorite}
                        aria-label={`${isFavorite ? 'Unfavorite' : 'Favorite'} ${repo.fullName}`}
                        onClick={() => void favorite(repo.sourceId, repo.externalId, !isFavorite)}
                      >
                        {isFavorite ? 'Favorited' : 'Favorite'}
                      </Button>
                      <span className="min-w-0 truncate" title={repo.description ?? repo.fullName}>
                        {repo.fullName}
                        {repo.isPrivate ? ' · private' : ''}
                        {repo.isArchived ? ' · archived' : ''}
                      </span>
                    </div>
                  )
                })}
            </div>
            {pickerError && (
              <p role="alert" className="text-xs text-[var(--g-color-text-danger)]">
                {pickerError}
              </p>
            )}
            {!loading && repos.length === 0 && !pickerError && (
              <p className="text-xs">No accessible repos.</p>
            )}
            {loading && (
              <p role="status" className="text-xs">
                Loading repos…
              </p>
            )}
            {nextPage && (
              <Button size="s" loading={loading} onClick={() => void load(source.id, nextPage)}>
                Load more
              </Button>
            )}
            {pickerError && (
              <Button size="s" onClick={() => void load(source.id, nextPage ?? 1)}>
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}
