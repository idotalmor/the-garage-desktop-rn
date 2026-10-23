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

  const repositories = useMemo(
    () => (snapshot?.repositories ?? []).map(toUiRepository),
    [snapshot?.repositories]
  )

  return {
    snapshot,
    repositories,
    addFolders: () => invoke(LocalReposChannel.AddSources),
    removeFolder: (id) => invoke(LocalReposChannel.RemoveSource, id),
    rescan: (sourceId) => invoke(LocalReposChannel.Rescan, sourceId),
    reset: () => invoke(LocalReposChannel.Reset)
  }
}
