import { useCallback, useEffect, useMemo, useState } from 'react'
import { WorktreesChannel } from '../../../../../shared/worktrees/channels'
import type { WorktreesSnapshot } from '../../../../../shared/worktrees/types'
import type { Repository } from '../components/types'
import { toUiRepository } from '../local-repositories'

export function useLocalRepositories(): {
  snapshot: WorktreesSnapshot | null
  repositories: Repository[]
  addFolders: () => Promise<void>
  removeFolder: (id: string) => Promise<void>
  rescan: (rootId?: string) => Promise<void>
} {
  const [snapshot, setSnapshot] = useState<WorktreesSnapshot | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.electron.ipcRenderer.invoke(WorktreesChannel.GetSnapshot).then((next) => {
      if (!cancelled) setSnapshot(next as WorktreesSnapshot)
    })
    const unsubscribe = window.electron.ipcRenderer.on(WorktreesChannel.Changed, (_, next) => {
      setSnapshot(next as WorktreesSnapshot)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const invoke = useCallback(async (channel: string, ...args: unknown[]) => {
    setSnapshot((await window.electron.ipcRenderer.invoke(channel, ...args)) as WorktreesSnapshot)
  }, [])

  const repositories = useMemo(
    () => (snapshot?.repositories ?? []).map(toUiRepository),
    [snapshot?.repositories]
  )

  return {
    snapshot,
    repositories,
    addFolders: () => invoke(WorktreesChannel.AddRoots),
    removeFolder: (id) => invoke(WorktreesChannel.RemoveRoot, id),
    rescan: (rootId) => invoke(WorktreesChannel.Rescan, rootId)
  }
}
