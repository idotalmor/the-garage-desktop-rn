/** Composes local/provider data and persists desktop ordering without changing local repo ids. */
import { useCallback, useMemo, useState } from 'react'
import type { GitSourcesSnapshot } from '../../../../shared/git-sources/types'
import type { LocalReposSnapshot } from '../../../../shared/local-repos/types'
import type { Repository } from '../github/components/types'
import { mergeRepos } from './repositories'
const ORDER_KEY = 'the-garage.git-sources.order'
function readOrder(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}
export function useGitRepositories(
  local: LocalReposSnapshot | null,
  remote: GitSourcesSnapshot | null,
  saveLocalOrder: (ids: string[]) => Promise<void>
): { repositories: Repository[]; setOrder: (ids: string[]) => Promise<void> } {
  const [order, setSavedOrder] = useState(readOrder)
  const repositories = useMemo(() => {
    const rank = new Map(order.map((id, index) => [id, index]))
    return mergeRepos(local?.repos ?? [], remote).sort(
      (a, b) => (rank.get(a.id!) ?? order.length) - (rank.get(b.id!) ?? order.length)
    )
  }, [local, remote, order])
  const setOrder = useCallback(
    async (ids: string[]) => {
      setSavedOrder(ids)
      localStorage.setItem(ORDER_KEY, JSON.stringify(ids))
      const localIds = new Set(local?.repos.map((repo) => repo.id))
      await saveLocalOrder(ids.filter((id) => localIds.has(id)))
    },
    [local, saveLocalOrder]
  )
  return { repositories, setOrder }
}
