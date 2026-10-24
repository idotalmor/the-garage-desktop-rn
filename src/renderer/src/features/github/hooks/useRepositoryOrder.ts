import { arrayMove } from '@dnd-kit/sortable'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Repository } from '../components/types'

export const REPO_SORTS = [
  { id: 'updated', label: 'Recently updated' },
  { id: 'worktrees', label: 'Most worktrees' },
  { id: 'name', label: 'Name (A–Z)' }
] as const

export type RepoSort = (typeof REPO_SORTS)[number]['id']
/** What the sort menu shows: a sort, or `custom` after the user dragged a repo. */
export type RepoOrderMode = RepoSort | 'custom'

const STORAGE_KEY = 'the-garage.local-repos.sort'

const byName = (a: Repository, b: Repository): number => a.name.localeCompare(b.name)

const compare: Record<RepoSort, (a: Repository, b: Repository) => number> = {
  updated: (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || byName(a, b),
  worktrees: (a, b) => b.worktrees.length - a.worktrees.length || byName(a, b),
  name: byName
}

export const repoKey = (repo: Repository): string => repo.id ?? repo.name

function readSavedMode(): RepoOrderMode {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'custom') return saved
  return REPO_SORTS.find((option) => option.id === saved)?.id ?? 'updated'
}

/**
 * The user's repo order. `repositories` already arrive in the saved order (`local_repos.position`),
 * so live updates never move them. Picking a sort or dragging a repo saves a new order; repos that
 * were never placed (e.g. just found) go last. The first time repos appear unplaced, they are sorted once.
 */
export function useRepositoryOrder(
  repositories: Repository[],
  saveOrder: (ids: string[]) => Promise<void>
): {
  mode: RepoOrderMode
  sortBy: (sort: RepoSort) => void
  move: (activeKey: string, overKey: string) => void
} {
  const [mode, setMode] = useState<RepoOrderMode>(readSavedMode)
  const sortedOnce = useRef(false)

  const changeMode = useCallback((next: RepoOrderMode) => {
    localStorage.setItem(STORAGE_KEY, next)
    setMode(next)
  }, [])

  const sortBy = useCallback(
    (sort: RepoSort) => {
      changeMode(sort)
      void saveOrder([...repositories].sort(compare[sort]).map(repoKey))
    },
    [changeMode, repositories, saveOrder]
  )

  const move = useCallback(
    (activeKey: string, overKey: string) => {
      const keys = repositories.map(repoKey)
      const from = keys.indexOf(activeKey)
      const to = keys.indexOf(overKey)
      if (from < 0 || to < 0 || from === to) return
      changeMode('custom')
      void saveOrder(arrayMove(keys, from, to))
    },
    [changeMode, repositories, saveOrder]
  )

  useEffect(() => {
    if (sortedOnce.current || repositories.length === 0) return
    sortedOnce.current = true
    if (repositories.every((repo) => repo.position == null)) {
      void saveOrder(
        [...repositories].sort(compare[mode === 'custom' ? 'updated' : mode]).map(repoKey)
      )
    }
  }, [mode, repositories, saveOrder])

  return { mode, sortBy, move }
}
