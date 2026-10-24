import { arrayMove } from '@dnd-kit/sortable'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Repository } from '../components/types'

export const REPO_SORTS = [
  { id: 'updated', label: 'Recently updated' },
  { id: 'worktrees', label: 'Most worktrees' },
  { id: 'name', label: 'Name (A–Z)' }
] as const

export type RepoSort = (typeof REPO_SORTS)[number]['id']
/** What the sort menu shows: a sort, or `custom` after the user saved a manual order. */
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
 * so live updates never move them. Picking a sort saves that order right away; "manual" enters an
 * edit mode where every repo shows a drag grip and drags only stage `pending` keys until Save
 * (persist + mode `custom`) or Cancel (discard). Repos never placed go last; the first time all
 * repos appear unplaced, they are sorted once.
 */
export function useRepositoryOrder(
  repositories: Repository[],
  saveOrder: (ids: string[]) => Promise<void>
): {
  mode: RepoOrderMode
  manual: boolean
  ordered: Repository[]
  sortBy: (sort: RepoSort) => void
  move: (activeKey: string, overKey: string) => void
  startManual: () => void
  saveManual: () => void
  cancelManual: () => void
} {
  const [mode, setMode] = useState<RepoOrderMode>(readSavedMode)
  const [manual, setManual] = useState(false)
  const [pending, setPending] = useState<string[] | null>(null)
  const sortedOnce = useRef(false)

  const changeMode = useCallback((next: RepoOrderMode) => {
    localStorage.setItem(STORAGE_KEY, next)
    setMode(next)
  }, [])

  const exitManual = useCallback(() => {
    setManual(false)
    setPending(null)
  }, [])

  const sortBy = useCallback(
    (sort: RepoSort) => {
      exitManual()
      changeMode(sort)
      void saveOrder([...repositories].sort(compare[sort]).map(repoKey))
    },
    [changeMode, exitManual, repositories, saveOrder]
  )

  const startManual = useCallback(() => {
    setPending(repositories.map(repoKey))
    setManual(true)
  }, [repositories])

  const saveManual = useCallback(() => {
    if (!pending) return
    changeMode('custom')
    void saveOrder(pending)
    exitManual()
  }, [changeMode, exitManual, pending, saveOrder])

  const move = useCallback(
    (activeKey: string, overKey: string) => {
      if (!pending) return
      const from = pending.indexOf(activeKey)
      const to = pending.indexOf(overKey)
      if (from < 0 || to < 0 || from === to) return
      setPending(arrayMove(pending, from, to))
    },
    [pending]
  )

  // In manual mode the list follows the staged keys; anything not staged (new repo mid-edit) goes last.
  const ordered = useMemo(() => {
    if (!manual || !pending) return repositories
    const rank = new Map(pending.map((key, index) => [key, index]))
    return [...repositories].sort(
      (a, b) => (rank.get(repoKey(a)) ?? pending.length) - (rank.get(repoKey(b)) ?? pending.length)
    )
  }, [manual, pending, repositories])

  useEffect(() => {
    if (sortedOnce.current || repositories.length === 0) return
    sortedOnce.current = true
    if (repositories.every((repo) => repo.position == null)) {
      void saveOrder(
        [...repositories].sort(compare[mode === 'custom' ? 'updated' : mode]).map(repoKey)
      )
    }
  }, [mode, repositories, saveOrder])

  return { mode, manual, ordered, sortBy, move, startManual, saveManual, cancelManual: exitManual }
}
