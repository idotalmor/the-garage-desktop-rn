/** Subscribes to main-owned Git sources; runs device polling without exposing credentials. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { GitSourcesChannel } from '../../../../shared/git-sources/channels'
import type {
  GitSourcesSnapshot,
  GitSourceRepoPage,
  CheckoutRequest,
  CheckoutPlan
} from '../../../../shared/git-sources/types'

export function useGitSources(): {
  snapshot: GitSourcesSnapshot | null
  error: string | null
  busy: boolean
  checkoutPath: string | null
  connect: () => Promise<void>
  cancel: () => Promise<void>
  disconnect: (sourceId: string) => Promise<void>
  refresh: (sourceId: string) => Promise<void>
  favorite: (sourceId: string, externalId: string, selected: boolean) => Promise<void>
  listRepos: (sourceId: string, page: number) => Promise<GitSourceRepoPage>
  createCheckout: (request: CheckoutRequest) => Promise<void>
} {
  const [snapshot, setSnapshot] = useState<GitSourcesSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [checkoutPath, setCheckoutPath] = useState<string | null>(null)
  const mounted = useRef(false)
  const polling = useRef<string | null>(null)
  useEffect(() => {
    mounted.current = true
    let active = true
    let changed = false
    const unsubscribe = window.electron.ipcRenderer.on(GitSourcesChannel.Changed, (_, value) => {
      changed = true
      setSnapshot(value as GitSourcesSnapshot)
    })
    void window.electron.ipcRenderer
      .invoke(GitSourcesChannel.GetSnapshot)
      .then((value) => {
        if (active && !changed) setSnapshot(value as GitSourcesSnapshot)
      })
      .catch((error) => {
        if (active) setError(String(error))
      })
    return () => {
      active = false
      mounted.current = false
      unsubscribe()
    }
  }, [])
  const invoke = useCallback(async (channel: string, ...args: unknown[]): Promise<void> => {
    setError(null)
    setBusy(true)
    try {
      await window.electron.ipcRenderer.invoke(channel, ...args)
    } catch (error) {
      if (mounted.current) setError(error instanceof Error ? error.message : String(error))
    } finally {
      if (mounted.current) setBusy(false)
    }
  }, [])
  const code = snapshot?.authorization?.userCode
  useEffect(() => {
    if (!code || polling.current === code) return
    polling.current = code
    void window.electron.ipcRenderer.invoke(GitSourcesChannel.Complete).catch((error) => {
      if (mounted.current && polling.current === code && !String(error).includes('abort'))
        setError(String(error))
    })
  }, [code])
  return {
    snapshot,
    error,
    busy,
    checkoutPath,
    createCheckout: async (request) => {
      setCheckoutPath(null)
      setError(null)
      setBusy(true)
      try {
        const plan = (await window.electron.ipcRenderer.invoke(
          GitSourcesChannel.PrepareCheckout,
          request
        )) as CheckoutPlan
        const path = await window.electron.ipcRenderer.invoke(
          GitSourcesChannel.CreateCheckout,
          request,
          plan.suggestedParent,
          plan.folderName
        )
        if (mounted.current && typeof path === 'string') setCheckoutPath(path)
      } catch (error) {
        if (mounted.current) setError(error instanceof Error ? error.message : String(error))
      } finally {
        if (mounted.current) setBusy(false)
      }
    },
    connect: () => invoke(GitSourcesChannel.Connect),
    cancel: () => {
      polling.current = null
      return invoke(GitSourcesChannel.Cancel)
    },
    disconnect: (sourceId) => invoke(GitSourcesChannel.Disconnect, sourceId),
    refresh: (sourceId) => invoke(GitSourcesChannel.Refresh, sourceId),
    favorite: (sourceId, externalId, selected) =>
      invoke(GitSourcesChannel.SetFavorite, sourceId, externalId, selected),
    listRepos: (sourceId, page) =>
      window.electron.ipcRenderer.invoke(
        GitSourcesChannel.ListRepos,
        sourceId,
        page
      ) as Promise<GitSourceRepoPage>
  }
}
