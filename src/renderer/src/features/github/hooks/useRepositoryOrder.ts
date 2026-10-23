import { useCallback, useMemo, useState } from 'react'
import type { Repository } from '../components/types'

export const REPO_SORTS = [
  { id: 'updated', label: 'Recently updated' },
  { id: 'worktrees', label: 'Most worktrees' },
  { id: 'name', label: 'Name (A–Z)' }
] as const

export type RepoSort = (typeof REPO_SORTS)[number]['id']

const STORAGE_KEY = 'the-garage.local-repos.sort'

const byName = (a: Repository, b: Repository): number => a.name.localeCompare(b.name)

const compare: Record<RepoSort, (a: Repository, b: Repository) => number> = {
  updated: (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || byName(a, b),
  worktrees: (a, b) => b.worktrees.length - a.worktrees.length || byName(a, b),
  name: byName
}

const keyOf = (repo: Repository): string => repo.id ?? repo.name

function sortedKeys(repositories: Repository[], sort: RepoSort): string[] {
  return [...repositories].sort(compare[sort]).map(keyOf)
}

function readSavedSort(): RepoSort {
  const saved = localStorage.getItem(STORAGE_KEY)
  return REPO_SORTS.find((option) => option.id === saved)?.id ?? 'updated'
}

/**
 * Keeps repos in a fixed order so live updates don't move cards while the user works. The order is
 * set once when repos first appear and again only when `sortBy` is called; new repos go at the end.
 */
export function useRepositoryOrder(repositories: Repository[]): {
  sort: RepoSort
  sorted: Repository[]
  sortBy: (sort: RepoSort) => void
} {
  const [sort, setSort] = useState<RepoSort>(readSavedSort)
  const [order, setOrder] = useState<string[] | null>(null)

  // Adjusting state during render (not in an effect) so the first paint is already sorted.
  if (order === null && repositories.length > 0) setOrder(sortedKeys(repositories, sort))
  if (order !== null && repositories.length === 0) setOrder(null)

  const sortBy = useCallback(
    (next: RepoSort) => {
      localStorage.setItem(STORAGE_KEY, next)
      setSort(next)
      setOrder(sortedKeys(repositories, next))
    },
    [repositories]
  )

  const sorted = useMemo(() => {
    if (!order) return repositories
    const byKey = new Map(repositories.map((repo) => [keyOf(repo), repo]))
    const placed = new Set(order)
    return [
      ...order.flatMap((key) => byKey.get(key) ?? []),
      ...repositories.filter((repo) => !placed.has(keyOf(repo)))
    ]
  }, [order, repositories])

  return { sort, sorted, sortBy }
}
