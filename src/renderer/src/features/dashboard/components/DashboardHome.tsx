import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { ArrowDownUp, Check, ChevronDown, FolderPlus, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Dropdown } from '@heroui/react'
import { CommitHistoryModal } from '../../github/components/CommitHistoryModal'
import { CreatePrModal } from '../../github/components/CreatePrModal'
import { DeleteWorktreeModal } from '../../github/components/DeleteWorktreeModal'
import { PullErrorModal } from '../../github/components/PullErrorModal'
import { GitHubCard, GitHubLink } from '../../github/components/GitHubCard'
import { buildRepositoryCards } from '../../github/components/repository-cards'
import { SortableRepository } from '../../github/components/SortableRepository'
import { SourceChips } from '../../github/components/SourceChips'
import type { CommitSource, Repository, Worktree } from '../../github/components/types'
import { useLocalRepositories } from '../../github/hooks/useLocalRepositories'
import {
  REPO_SORTS,
  repoKey,
  useRepositoryOrder,
  type RepoSort
} from '../../github/hooks/useRepositoryOrder'
import { buildJiraCards } from './jira-cards'
import { GitSourcesPanel, GitSourcesSettingsButton } from '../../git-sources/GitSourcesPanel'
import { useGitSources } from '../../git-sources/useGitSources'
import { useGitRepositories } from '../../git-sources/useGitRepositories'

export function DashboardHome(): React.JSX.Element {
  const {
    snapshot,
    addFolders,
    removeFolder,
    reset,
    setOrder: setLocalOrder,
    openIde,
    openFolder,
    deleteWorktree,
    pull
  } = useLocalRepositories()
  const gitSources = useGitSources()
  const [gitSettingsOpen, setGitSettingsOpen] = useState(false)
  const [dismissedGitNotice, setDismissedGitNotice] = useState<string | null>(null)
  const gitSettingsNotice = gitSources.error ?? gitSources.snapshot?.authorization?.userCode ?? null
  const gitSettingsVisible =
    gitSettingsOpen || Boolean(gitSettingsNotice && gitSettingsNotice !== dismissedGitNotice)
  const { repositories, setOrder } = useGitRepositories(
    snapshot,
    gitSources.snapshot,
    setLocalOrder
  )
  const { mode, manual, ordered, sortBy, move, startManual, saveManual, cancelManual } =
    useRepositoryOrder(repositories, setOrder)
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [checkoutPending, setCheckoutPending] = useState<string | null>(null)
  const startCheckout = async (repo: Repository, branch: string | null): Promise<void> => {
    if (checkoutPending || (!repo.isLocal && !repo.gitSourceRepo)) return
    setCheckoutPending(repoKey(repo))
    try {
      await gitSources.createCheckout({
        repo:
          repo.isLocal && repo.id
            ? { kind: 'local', id: repo.id }
            : {
                kind: 'remote',
                sourceId: repo.gitSourceRepo!.sourceId,
                externalId: repo.gitSourceRepo!.externalId
              },
        branch
      })
    } finally {
      setCheckoutPending(null)
    }
  }
  const [selectedRecipient, setSelectedRecipient] = useState('Default · #eng-review')
  const [linkedTasks, setLinkedTasks] = useState<Record<string, string>>({})
  const [babysitter, setBabysitter] = useState<Record<number, boolean>>({})
  const [selectedHistory, setSelectedHistory] = useState<{
    title: string
    hasUncommitted?: boolean
    source?: CommitSource
  } | null>(null)
  const [selectedWorktree, setSelectedWorktree] = useState<{
    repo: Repository
    worktree: Worktree
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Worktree | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pulling, setPulling] = useState<Record<string, boolean>>({})
  const [pullError, setPullError] = useState<{
    worktree: Worktree
    message: string
    hint: string | null
  } | null>(null)

  const startPull = async (worktree: Worktree): Promise<void> => {
    const path = worktree.path
    if (!path || pulling[path]) return
    setPulling((current) => ({ ...current, [path]: true }))
    try {
      const result = await pull(path)
      if (!result.ok) setPullError({ worktree, message: result.message, hint: result.hint })
    } catch (error) {
      setPullError({
        worktree,
        message: error instanceof Error ? error.message : String(error),
        hint: null
      })
    } finally {
      setPulling((current) => {
        const next = { ...current }
        delete next[path]
        return next
      })
    }
  }

  const openContext = (): void => {
    window.open('?view=artifactory', '_blank', 'width=900,height=600')
  }
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggleCollapsed = (key: string): void =>
    setCollapsed((current) => ({ ...current, [key]: !current[key] }))
  const linkTask = (key: string): void =>
    setLinkedTasks((current) => ({ ...current, [key]: current[key] ? '' : 'DEV-192' }))

  const confirmDelete = async (deleteRemote: boolean): Promise<void> => {
    if (!deleteTarget?.path) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteWorktree(deleteTarget.path, deleteRemote)
      setDeleteTarget(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-8 pt-14 sm:px-5 lg:px-6 lg:pt-16">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">The Garage</h1>

      <section aria-labelledby="github-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 id="github-heading" className="text-sm font-semibold">
            <button
              type="button"
              onClick={() => toggleCollapsed('github')}
              aria-expanded={!collapsed['github']}
              aria-controls="github-section"
              className="flex items-center gap-1.5"
            >
              <ChevronDown
                size={14}
                className={`text-muted transition-transform ${collapsed['github'] ? '-rotate-90' : ''}`}
                aria-hidden="true"
              />
              Git
            </button>
          </h2>
          <GitSourcesSettingsButton
            expanded={gitSettingsVisible}
            onToggle={() => {
              setGitSettingsOpen(!gitSettingsVisible)
              setDismissedGitNotice(gitSettingsVisible ? gitSettingsNotice : null)
            }}
          />
          {snapshot?.scanning && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              Scanning
              {snapshot.progress ? ` · ${snapshot.progress.reposFound} repos` : '…'}
            </span>
          )}
          <div className="ml-auto flex min-w-0 items-center gap-1">
            {repositories.length > 1 && (
              <>
                <Dropdown>
                  <Dropdown.Trigger
                    className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground"
                    aria-label="Sort repositories"
                  >
                    <ArrowDownUp size={14} aria-hidden="true" />
                  </Dropdown.Trigger>
                  <Dropdown.Popover placement="bottom end">
                    <Dropdown.Menu
                      aria-label="Sort repositories"
                      onAction={(key) =>
                        key === 'manual' ? startManual() : sortBy(key as RepoSort)
                      }
                    >
                      {REPO_SORTS.map((option) => (
                        <Dropdown.Item key={option.id} id={option.id} className="text-xs">
                          <span className="flex items-center gap-2">
                            {option.label}
                            {mode === option.id && (
                              <Check size={11} className="text-muted" aria-hidden="true" />
                            )}
                          </span>
                        </Dropdown.Item>
                      ))}
                      <Dropdown.Item id="manual" className="text-xs">
                        Manual order
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
                {manual && (
                  <div className="flex h-7 items-stretch rounded-full border border-border bg-surface">
                    <button
                      type="button"
                      aria-label="Save order"
                      className="flex items-center rounded-l-full px-2 text-success hover:bg-surface-secondary"
                      onClick={saveManual}
                    >
                      <Check size={13} aria-hidden="true" />
                    </button>
                    <span className="w-px bg-separator" aria-hidden="true" />
                    <button
                      type="button"
                      aria-label="Cancel order changes"
                      className="flex items-center rounded-r-full px-2 text-muted hover:bg-surface-secondary hover:text-foreground"
                      onClick={cancelManual}
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </>
            )}
            <SourceChips
              sources={snapshot?.sources ?? []}
              onAdd={() => void addFolders()}
              onRemove={(id) => void removeFolder(id)}
              onReset={() => void reset()}
            />
          </div>
        </div>
        <div id="git-settings-panel" hidden={!gitSettingsVisible}>
          <GitSourcesPanel connection={gitSources} />
        </div>
        {!collapsed['github'] && (
          <div id="github-section" className="space-y-4">
            {snapshot && repositories.length === 0 && (
              <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border p-4 text-xs text-muted">
                {snapshot.sources.length === 0 ? (
                  <>
                    <p>Add the folders where you keep your repositories and worktrees.</p>
                    <Button
                      size="sm"
                      variant="primary"
                      className="h-7 rounded-lg text-xs"
                      onPress={() => void addFolders()}
                    >
                      <FolderPlus size={13} /> Add folders to scan
                    </Button>
                  </>
                ) : snapshot.scanning ? (
                  <p>
                    Scanning your folders
                    {snapshot.progress
                      ? ` · ${snapshot.progress.dirsVisited} folders checked`
                      : '…'}
                  </p>
                ) : (
                  <p>No git repositories found in your folders.</p>
                )}
              </div>
            )}
            <DndContext
              sensors={dragSensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (over) move(String(active.id), String(over.id))
              }}
            >
              <SortableContext items={ordered.map(repoKey)} strategy={verticalListSortingStrategy}>
                {ordered.map((repo) => (
                  <SortableRepository key={repoKey(repo)} id={repoKey(repo)} label={repo.name}>
                    {(handle) => (
                      <>
                        <h3 className="group/title relative flex items-center gap-2 pr-7 text-sm font-semibold">
                          {manual && handle}
                          <span className={`size-3 shrink-0 rounded-full ${repo.color}`} />
                          <GitHubLink
                            url={repo.githubUrl}
                            label={`Open ${repo.detail} on GitHub`}
                          />
                          <button
                            type="button"
                            onClick={() => toggleCollapsed(repo.id ?? repo.name)}
                            aria-expanded={!collapsed[repo.id ?? repo.name]}
                            className="flex min-w-0 items-center gap-1.5"
                          >
                            <ChevronDown
                              size={13}
                              className={`shrink-0 text-muted transition-transform ${collapsed[repo.id ?? repo.name] ? '-rotate-90' : ''}`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{repo.name}</span>
                          </button>
                          <span
                            className="truncate text-xs font-normal text-muted"
                            title={repo.detail}
                          >
                            {[
                              repo.detail,
                              repo.gitSourceRepo ? 'GitHub' : null,
                              `${repo.worktrees.length} worktrees`
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </h3>
                        {!collapsed[repo.id ?? repo.name] && (
                          <div className="flex flex-wrap gap-2">
                            {buildRepositoryCards({
                              repository: repo,
                              cloning: checkoutPending === repoKey(repo),
                              checkoutDisabled: checkoutPending !== null || gitSources.busy,
                              onClone:
                                repo.isLocal || repo.gitSourceRepo
                                  ? (branch) => void startCheckout(repo, branch)
                                  : undefined,
                              selectedRecipient,
                              linkedTasks,
                              babysitter,
                              onRecipientChange: setSelectedRecipient,
                              onHistory: (title, hasUncommitted, source) =>
                                setSelectedHistory({ title, hasUncommitted, source }),
                              onLinkTask: linkTask,
                              onOpenWorktree: (worktree) => setSelectedWorktree({ repo, worktree }),
                              onBabysitter: (number) =>
                                setBabysitter({ ...babysitter, [number]: !babysitter[number] }),
                              onOpenIde: (ide, path) =>
                                void openIde(ide, path).catch((error) =>
                                  console.warn('[open-ide]', error)
                                ),
                              onOpenFolder: (path) =>
                                void openFolder(path).catch((error) =>
                                  console.warn('[open-folder]', error)
                                ),
                              onDelete: (worktree) => {
                                setDeleteError(null)
                                setDeleteTarget(worktree)
                              },
                              pulling,
                              onPull: (worktree) => void startPull(worktree)
                            }).map(({ key, ...card }) => (
                              <GitHubCard key={key} {...card} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </SortableRepository>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </section>

      <section aria-labelledby="jira-heading" className="mt-8 space-y-2">
        <h2 id="jira-heading" className="text-sm font-semibold">
          <button
            type="button"
            onClick={() => toggleCollapsed('jira')}
            aria-expanded={!collapsed['jira']}
            aria-controls="jira-section"
            className="flex items-center gap-1.5"
          >
            <ChevronDown
              size={14}
              className={`text-muted transition-transform ${collapsed['jira'] ? '-rotate-90' : ''}`}
              aria-hidden="true"
            />
            Jira
          </button>
        </h2>
        {!collapsed['jira'] && (
          <div id="jira-section" className="flex flex-wrap gap-2">
            {buildJiraCards().map(({ key, ...card }) => (
              <GitHubCard key={key} {...card} />
            ))}
          </div>
        )}
      </section>

      {selectedHistory && (
        <CommitHistoryModal
          title={selectedHistory.title}
          hasUncommitted={selectedHistory.hasUncommitted}
          source={selectedHistory.source}
          onClose={() => setSelectedHistory(null)}
        />
      )}
      {selectedWorktree && (
        <CreatePrModal
          repo={selectedWorktree.repo}
          worktree={selectedWorktree.worktree}
          onClose={() => setSelectedWorktree(null)}
          onContext={openContext}
        />
      )}
      {pullError && (
        <PullErrorModal
          worktree={pullError.worktree}
          message={pullError.message}
          hint={pullError.hint}
          onOpenTerminal={(path) =>
            void openIde('terminal', path).catch((error) => console.warn('[open-ide]', error))
          }
          onClose={() => setPullError(null)}
        />
      )}
      {deleteTarget && (
        <DeleteWorktreeModal
          worktree={deleteTarget}
          deleting={deleting}
          error={deleteError}
          onDelete={(remote) => void confirmDelete(remote)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </main>
  )
}
