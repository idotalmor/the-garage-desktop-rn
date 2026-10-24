import { useCallback, useEffect, useMemo, useState } from 'react'
import { LocalReposChannel } from '../../../../../shared/local-repos/channels'
import type { LocalReposSnapshot } from '../../../../../shared/local-repos/types'
import type { Repository } from '../components/types'
import { toUiRepository } from '../local-repositories'

export function useLocalRepositories(): {
  snapshot: LocalReposSnapshot | null
  repositories: Repository[]
  addFolders: () => Promise<void>
  removeFolder: (id: string) => Promise<void>
  rescan: (sourceId?: string) => Promise<void>
  reset: () => Promise<void>
  setOrder: (ids: string[]) => Promise<void>
  openIde: (ide: string, path: string) => Promise<void>
  openFolder: (path: string) => Promise<void>
  deleteWorktree: (path: string, deleteRemote: boolean) => Promise<void>
} {
  const [snapshot, setSnapshot] = useState<LocalReposSnapshot | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.electron.ipcRenderer.invoke(LocalReposChannel.GetSnapshot).then((next) => {
      if (!cancelled) setSnapshot(next as LocalReposSnapshot)
    })
    const unsubscribe = window.electron.ipcRenderer.on(LocalReposChannel.Changed, (_, next) => {
      setSnapshot(next as LocalReposSnapshot)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const invoke = useCallback(async (channel: string, ...args: unknown[]) => {
    setSnapshot((await window.electron.ipcRenderer.invoke(channel, ...args)) as LocalReposSnapshot)
  }, [])

  const repositories = useMemo(() => (snapshot?.repos ?? []).map(toUiRepository), [snapshot?.repos])

  return {
    snapshot,
    repositories,
    addFolders: () => invoke(LocalReposChannel.AddSources),
    removeFolder: (id) => invoke(LocalReposChannel.RemoveSource, id),
    rescan: (sourceId) => invoke(LocalReposChannel.Rescan, sourceId),
    reset: () => invoke(LocalReposChannel.Reset),
    openIde: (ide, path) =>
      window.electron.ipcRenderer.invoke(LocalReposChannel.OpenIde, ide, path) as Promise<void>,
    openFolder: (path) =>
      window.electron.ipcRenderer.invoke(LocalReposChannel.OpenFolder, path) as Promise<void>,
    deleteWorktree: (path, deleteRemote) =>
      invoke(LocalReposChannel.DeleteWorktree, path, deleteRemote),
    setOrder: async (ids) => {
      // Reorder right away so a dropped card doesn't jump back while the DB saves.
      setSnapshot((current) => {
        if (!current) return current
        const rank = new Map(ids.map((id, index) => [id, index]))
        const repositories = [...current.repos].sort(
          (a, b) => (rank.get(a.id) ?? ids.length) - (rank.get(b.id) ?? ids.length)
        )
        return { ...current, repos: repositories }
      })
      await invoke(LocalReposChannel.SetOrder, ids)
    }
  }
}
