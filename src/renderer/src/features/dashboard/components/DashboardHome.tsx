import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { CommitHistoryModal } from '../../github/components/CommitHistoryModal'
import { CreatePrModal } from '../../github/components/CreatePrModal'
import { GitHubCard } from '../../github/components/GitHubCard'
import { buildRepositoryCards, repositories } from '../../github/components/repository-cards'
import type { Repository, Worktree } from '../../github/components/types'
import { buildJiraCards } from './jira-cards'

export function DashboardHome(): React.JSX.Element {
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

      <section aria-labelledby="jira-heading" className="space-y-2">
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

      <section aria-labelledby="github-heading" className="mt-8 space-y-4">
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
        {!collapsed['github'] && (
          <div id="github-section" className="space-y-4">
            {repositories.map((repo) => (
              <div key={repo.name} className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(repo.name)}
                    aria-expanded={!collapsed[repo.name]}
                    className="flex items-center gap-1.5"
                  >
                    <ChevronDown
                      size={13}
                      className={`text-muted transition-transform ${collapsed[repo.name] ? '-rotate-90' : ''}`}
                      aria-hidden="true"
                    />
                    <span className={`size-3 rounded-full ${repo.color}`} />
                    {repo.name}
                  </button>
                  <span className="text-xs font-normal text-muted">
                    {repo.detail} · {repo.prs.length} PRs · {repo.worktrees.length} worktrees
                  </span>
                </h3>
                {!collapsed[repo.name] && (
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

      {selectedHistory && (
        <CommitHistoryModal
          title={selectedHistory.title}
          hasUncommitted={selectedHistory.hasUncommitted}
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
    </main>
  )
}
