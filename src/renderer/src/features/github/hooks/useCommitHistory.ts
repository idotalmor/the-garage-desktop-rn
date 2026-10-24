/**
 * Pages through a card's local commit history over `local-repos:list-commits`. The first page loads
 * when the source changes; `loadMore` fetches the next one (the modal calls it on scroll). The
 * cursor from main pins every page to the first page's start commit, so rows never shift.
 * Worktree cards get only their branch's own commits; `baseRef` names the branch left out, and
 * `incoming` holds the upstream commits not pulled yet.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CommitCursor, CommitSummary } from '../../../../../shared/git/types'
import { LocalReposChannel } from '../../../../../shared/local-repos/channels'
import type { CommitHistoryPage, IncomingCommits } from '../../../../../shared/local-repos/types'
import type { CommitSource } from '../components/types'

type HistoryState = {
  commits: CommitSummary[]
  /** Cursor for the next page; null once the first commit was reached. */
  next: CommitCursor | null
  /** Ref whose commits are left out (e.g. `origin/main`), from the first page; null = full history. */
  baseRef: string | null
  /** Commits in the whole list, from the first page (null if git couldn't count). */
  total: number | null
  /** Upstream commits not pulled yet, from the first page; null when there are none. */
  incoming: IncomingCommits | null
  loading: boolean
  error: string | null
  /** The first page has come back (so an empty list means "no commits", not "loading"). */
  loaded: boolean
}

const initialState: HistoryState = {
  commits: [],
  next: null,
  baseRef: null,
  total: null,
  incoming: null,
  loading: false,
  error: null,
  loaded: false
}

export function useCommitHistory(source: CommitSource | undefined): HistoryState & {
  hasMore: boolean
  loadMore: () => void
  retry: () => void
} {
  const [state, setState] = useState<HistoryState>(initialState)
  // Bumped on every source change so a late reply for an old source is dropped.
  const generation = useRef(0)
  const inFlight = useRef(false)

  const fetchPage = useCallback(
    async (cursor: CommitCursor | null) => {
      if (!source || inFlight.current) return
      inFlight.current = true
      const requestGeneration = generation.current
      setState((current) => ({ ...current, loading: true, error: null }))
      try {
        const page = (await window.electron.ipcRenderer.invoke(
          LocalReposChannel.ListCommits,
          source.repoId,
          source.worktreePath,
          cursor
        )) as CommitHistoryPage
        if (requestGeneration !== generation.current) return
        setState((current) => {
          // Drop any overlap defensively (e.g. a duplicate request for the same page).
          const seen = new Set(current.commits.map((commit) => commit.hash))
          const fresh = cursor ? page.commits.filter((commit) => !seen.has(commit.hash)) : []
          return {
            commits: cursor ? [...current.commits, ...fresh] : page.commits,
            next: page.next,
            baseRef: cursor ? current.baseRef : page.baseRef,
            total: cursor ? current.total : page.total,
            incoming: cursor ? current.incoming : page.incoming,
            loading: false,
            error: null,
            loaded: true
          }
        })
      } catch (error) {
        if (requestGeneration !== generation.current) return
        setState((current) => ({
          ...current,
          loading: false,
          loaded: true,
          error: error instanceof Error ? error.message : String(error)
        }))
      } finally {
        if (requestGeneration === generation.current) inFlight.current = false
      }
    },
    [source]
  )

  useEffect(() => {
    generation.current += 1
    inFlight.current = false
    setState(initialState)
    void fetchPage(null)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (state.next && !state.loading && !state.error) void fetchPage(state.next)
  }, [fetchPage, state.next, state.loading, state.error])

  // After an error: redo the first page if it never arrived, else the page that failed.
  const retry = useCallback(() => {
    if (state.loading) return
    void fetchPage(state.commits.length === 0 ? null : state.next)
  }, [fetchPage, state.loading, state.commits.length, state.next])

  return { ...state, hasMore: state.next !== null, loadMore, retry }
}
