/**
 * Commit history of one dashboard card, read from local git: a checkout's HEAD or the repo's
 * default branch. Loads 50 commits at a time and fetches the next page when the user scrolls
 * near the bottom (infinite scroll via an IntersectionObserver on a sentinel row). Commits on the
 * remote branch that aren't pulled yet are listed first, above a divider.
 */
import { ArrowDown, GitCommit, Loader2 } from 'lucide-react'
import type { CommitSummary } from '../../../../../shared/git/types'
import { useEffect, useRef, useState } from 'react'
import { useCommitHistory } from '../hooks/useCommitHistory'
import { timeAgo } from '../time-ago'
import { Modal } from './Modal'
import type { CommitSource } from './types'

/** Start loading the next page this far before the sentinel scrolls into view. */
const PRELOAD_MARGIN = '240px'

export function CommitHistoryModal({
  title,
  hasUncommitted,
  source,
  onClose
}: {
  title: string
  hasUncommitted?: boolean
  /** Local history to read; absent for mock cards, which have none. */
  source?: CommitSource
  onClose: () => void
}): React.JSX.Element {
  const { commits, baseRef, total, incoming, loading, loaded, error, hasMore, loadMore, retry } =
    useCommitHistory(source)
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const sentinel = useRef<HTMLLIElement | null>(null)

  // Re-created after every page, so a list still shorter than the viewport keeps loading.
  useEffect(() => {
    const target = sentinel.current
    if (!scroller || !target || !hasMore || loading || error) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { root: scroller, rootMargin: PRELOAD_MARGIN }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [scroller, hasMore, loading, error, loadMore, commits.length])

  return (
    <Modal title={`Commit history · ${title}`} onClose={onClose}>
      {loaded && !error && (
        <p className="mb-2 text-[11px] text-muted">
          <span className="font-medium text-foreground">
            {(total ?? commits.length).toLocaleString()}{' '}
            {(total ?? commits.length) === 1 ? 'commit' : 'commits'}
          </span>
          {baseRef ? (
            <>
              {' '}
              on this branch since it split from <code>{baseRef}</code>
            </>
          ) : null}
          {total !== null && commits.length < total && (
            <> · showing {commits.length.toLocaleString()}</>
          )}
        </p>
      )}
      <div ref={setScroller} className="-mx-1 max-h-[60vh] overflow-y-auto px-1">
        <ul className="space-y-2" aria-busy={loading || undefined}>
          {incoming && (
            <>
              <li className="flex items-center gap-1.5 px-1 text-[11px] font-medium text-accent">
                <ArrowDown size={12} aria-hidden="true" />
                {incoming.total.toLocaleString()} to pull from <code>{incoming.upstream}</code>
              </li>
              {incoming.commits.map((commit) => (
                <CommitRow key={`in-${commit.hash}`} commit={commit} incoming />
              ))}
              {incoming.total > incoming.commits.length && (
                <li className="px-1 text-[10px] text-muted">
                  +{(incoming.total - incoming.commits.length).toLocaleString()} more on{' '}
                  {incoming.upstream}
                </li>
              )}
              <li role="separator" className="flex items-center gap-2 py-1 text-[10px] text-muted">
                <span className="h-px flex-1 bg-separator" />
                Local branch
                <span className="h-px flex-1 bg-separator" />
              </li>
            </>
          )}
          {hasUncommitted && (
            <li className="flex items-center gap-2 rounded-lg border border-dashed border-warning/50 bg-warning/10 p-2 text-xs">
              <span className="size-2 shrink-0 rounded-full bg-warning" />
              <GitCommit size={14} className="text-warning" />
              <span className="min-w-0 flex-1 truncate font-medium text-warning">
                Uncommitted changes
              </span>
              <span className="shrink-0 text-[10px] text-muted">Working tree</span>
            </li>
          )}
          {commits.map((commit) => (
            <CommitRow key={commit.hash} commit={commit} />
          ))}
          {hasMore && <li ref={sentinel} aria-hidden="true" className="h-px" />}
        </ul>
        <HistoryStatus
          hasSource={Boolean(source)}
          loading={loading}
          loaded={loaded}
          error={error}
          baseRef={baseRef}
          empty={commits.length === 0}
          ended={!hasMore && commits.length > 0}
          onRetry={retry}
        />
      </div>
    </Modal>
  )
}

/** One commit: short hash, subject, author and age. `incoming` = on the remote, not pulled yet. */
function CommitRow({
  commit,
  incoming
}: {
  commit: CommitSummary
  incoming?: boolean
}): React.JSX.Element {
  return (
    <li
      className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
        incoming ? 'border-dashed border-accent/50 bg-accent/5' : 'border-border'
      }`}
    >
      <GitCommit size={14} className={`shrink-0 ${incoming ? 'text-accent' : 'text-muted'}`} />
      <code className="shrink-0 select-all" title={commit.hash}>
        {commit.hash.slice(0, 7)}
      </code>
      <span className="min-w-0 flex-1 truncate" title={commit.message}>
        {commit.message}
      </span>
      <span
        className="max-w-[40%] shrink-0 truncate text-[10px] text-muted"
        title={new Date(commit.committedAt).toLocaleString()}
      >
        {commit.author} · {timeAgo(commit.committedAt)}
      </span>
    </li>
  )
}

/** The line under the list: loading spinner, error with retry, empty state or end of history. */
function HistoryStatus({
  hasSource,
  loading,
  loaded,
  error,
  baseRef,
  empty,
  ended,
  onRetry
}: {
  hasSource: boolean
  loading: boolean
  loaded: boolean
  error: string | null
  baseRef: string | null
  empty: boolean
  ended: boolean
  onRetry: () => void
}): React.JSX.Element | null {
  const base = 'flex items-center justify-center gap-1.5 py-3 text-[11px] text-muted'
  if (!hasSource) return <p className={base}>No local git history for this card.</p>
  if (loading || !loaded) {
    return (
      <p className={base} role="status">
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        Loading commits…
      </p>
    )
  }
  if (error) {
    return (
      <p className={`${base} text-danger`} role="alert">
        Couldn’t read commits: {error}
        <button type="button" className="underline hover:text-foreground" onClick={onRetry}>
          Retry
        </button>
      </p>
    )
  }
  if (empty) {
    return <p className={base}>{baseRef ? 'No commits of its own yet.' : 'No commits yet.'}</p>
  }
  if (ended) {
    return (
      <p className={base}>{baseRef ? `Branched off ${baseRef} here` : 'Beginning of history'}</p>
    )
  }
  return null
}
