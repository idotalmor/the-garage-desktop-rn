import { ChevronDown, FolderPlus, FolderSearch, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@heroui/react'
import { CommitHistoryModal } from '../../github/components/CommitHistoryModal'
import { CreatePrModal } from '../../github/components/CreatePrModal'
import { GitHubCard } from '../../github/components/GitHubCard'
import { buildRepositoryCards } from '../../github/components/repository-cards'
import { SourcesModal } from '../../github/components/SourcesModal'
import type { Repository, Worktree } from '../../github/components/types'
import { useLocalRepositories } from '../../github/hooks/useLocalRepositories'
import { buildJiraCards } from './jira-cards'

export function DashboardHome(): React.JSX.Element {
  const { snapshot, repositories, addFolders, removeFolder, rescan } = useLocalRepositories()
  const [isSourcesOpen, setIsSourcesOpen] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState('Default · #eng-review')
  const [linkedTasks, setLinkedTasks] = useState<Record<string, string>>({})
  const [babysitter, setBabysitter] = useState<Record<number, boolean>>({})
  const [selectedHistory, setSelectedHistory] = useState<{
    title: string
    hasUncommitted?: boolean
  } | null>(null)
  const [selectedWorktree, setSelectedWorktree] = useState<{
    repo: Repository
    worktree: Worktree
  } | null>(null)

  const openContext = (): void => {
    window.open('?view=artifactory', '_blank', 'width=900,height=600')
  }
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggleCollapsed = (key: string): void =>
    setCollapsed((current) => ({ ...current, [key]: !current[key] }))
  const linkTask = (key: string): void =>
    setLinkedTasks((current) => ({ ...current, [key]: current[key] ? '' : 'DEV-192' }))

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
              GitHub
            </button>
          </h2>
          {snapshot?.scanning && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              Scanning
              {snapshot.progress ? ` · ${snapshot.progress.reposFound} repos` : '…'}
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 rounded-lg text-xs text-muted hover:text-foreground"
            onPress={() => setIsSourcesOpen(true)}
          >
            <FolderSearch size={13} /> Sources
            {snapshot && snapshot.scanFolders.length > 0 ? ` (${snapshot.scanFolders.length})` : ''}
          </Button>
        </div>
        {!collapsed['github'] && (
          <div id="github-section" className="space-y-4">
            {snapshot && repositories.length === 0 && (
              <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border p-4 text-xs text-muted">
                {snapshot.scanFolders.length === 0 ? (
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
                  <>
                    <p>No git repositories found in your folders.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg text-xs"
                      onPress={() => setIsSourcesOpen(true)}
                    >
                      <FolderSearch size={13} /> Manage sources
                    </Button>
                  </>
                )}
              </div>
            )}
            {repositories.map((repo) => (
              <div key={repo.id ?? repo.name} className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(repo.id ?? repo.name)}
                    aria-expanded={!collapsed[repo.id ?? repo.name]}
                    className="flex items-center gap-1.5"
                  >
                    <ChevronDown
                      size={13}
                      className={`text-muted transition-transform ${collapsed[repo.id ?? repo.name] ? '-rotate-90' : ''}`}
                      aria-hidden="true"
                    />
                    <span className={`size-3 rounded-full ${repo.color}`} />
                    {repo.name}
                  </button>
                  <span className="truncate text-xs font-normal text-muted" title={repo.detail}>
                    {[
                      repo.detail,
                      repo.isLocal ? null : `${repo.prs.length} PRs`,
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
                      selectedRecipient,
                      linkedTasks,
                      babysitter,
                      onRecipientChange: setSelectedRecipient,
                      onHistory: (title, hasUncommitted) =>
                        setSelectedHistory({ title, hasUncommitted }),
                      onLinkTask: linkTask,
                      onOpenWorktree: (worktree) => setSelectedWorktree({ repo, worktree }),
                      onBabysitter: (number) =>
                        setBabysitter({ ...babysitter, [number]: !babysitter[number] })
                    }).map(({ key, ...card }) => (
                      <GitHubCard key={key} {...card} />
                    ))}
                  </div>
                )}
              </div>
            ))}
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
            {buildJiraCards({
              onHistory: (title) => setSelectedHistory({ title })
            }).map(({ key, ...card }) => (
              <GitHubCard key={key} {...card} />
            ))}
          </div>
        )}
      </section>

      {selectedHistory && (
        <CommitHistoryModal
          title={selectedHistory.title}
          hasUncommitted={selectedHistory.hasUncommitted}
          onClose={() => setSelectedHistory(null)}
        />
      )}
      {isSourcesOpen && (
        <SourcesModal
          snapshot={snapshot}
          onAdd={() => void addFolders()}
          onRemove={(id) => void removeFolder(id)}
          onRescan={(scanFolderId) => void rescan(scanFolderId)}
          onClose={() => setIsSourcesOpen(false)}
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
    </main>
  )
}
