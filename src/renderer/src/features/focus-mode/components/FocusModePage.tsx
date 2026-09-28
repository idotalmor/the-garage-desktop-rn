import { Plus, RotateCcw, Settings, Timer } from 'lucide-react'
import { Button } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'
import { EditableText } from '../../../shared/components/EditableText'
import { PageHeader } from '../../../shared/components/PageHeader'
import {
  DEFAULT_FOCUS_FINISH_SOUND,
  FOCUS_MODE_DURATION_MS,
  type FocusFinishSound,
  type FocusTimer,
  type FocusTimerHistoryEntry
} from '../../../../../shared/focus-mode/types'
import { FocusPlanner } from './FocusPlanner'
import { FocusSettingsModal } from './FocusSettingsModal'
import { useFocusMode } from '../hooks/use-focus-mode'
import { FOCUS_DURATIONS, formatElapsed, formatTime, groupHistoryByDate } from '../utils'

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const paddedSeconds = seconds.toString().padStart(2, '0')
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSeconds}`
  return `${minutes}:${paddedSeconds}`
}

function AddTimerRow({
  onStart
}: {
  onStart: (options: { name: string | null; durationMs: number }) => void
}): React.JSX.Element {
  const [name, setName] = useState('')
  const [durationMs, setDurationMs] = useState(FOCUS_MODE_DURATION_MS)

  const start = (): void => {
    onStart({ name: name.trim() || null, durationMs })
    setName('')
  }

  return (
    <section
      className="mt-8 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3"
      aria-label="Add timer"
    >
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Plus size={15} aria-hidden="true" /> New timer
      </span>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Timer name (optional)"
        className="min-w-40 flex-1 rounded-md bg-surface-secondary px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted"
        onKeyDown={(event) => {
          if (event.key === 'Enter') start()
        }}
      />
      <div className="flex items-center gap-1" role="group" aria-label="Timer duration">
        {FOCUS_DURATIONS.map((duration) => (
          <button
            key={duration.label}
            type="button"
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              duration.durationMs === durationMs
                ? 'bg-accent text-on-accent'
                : 'bg-surface-secondary text-muted hover:text-foreground'
            }`}
            onClick={() => setDurationMs(duration.durationMs)}
            aria-pressed={duration.durationMs === durationMs}
          >
            {duration.label}
          </button>
        ))}
      </div>
      <Button size="sm" variant="secondary" onPress={start} aria-label="Start timer">
        Start
      </Button>
    </section>
  )
}

function ActiveTimerRow({
  timer,
  now,
  onRequestStop,
  onRename,
  onAgain,
  onDismiss
}: {
  timer: FocusTimer
  now: number
  onRequestStop: (id: string) => void
  onRename: (id: string, name: string) => void
  onAgain: (id: string) => void
  onDismiss: (id: string) => void
}): React.JSX.Element {
  const isScheduled = timer.state === 'scheduled'
  const isFinished = timer.state === 'finished'
  const isStopping = timer.state === 'stopping'
  const remainingMs = Math.max(0, timer.endsAt - now)

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <EditableText
            value={timer.name}
            placeholder="Unknown timer"
            onSave={(name) => onRename(timer.id, name)}
            className="min-w-0 truncate rounded-md border border-transparent px-1.5 py-0.5 text-left text-sm font-medium text-foreground hover:border-border"
            inputClassName="w-full min-w-0 rounded-md border border-border bg-surface-secondary px-1.5 py-0.5 text-sm font-medium text-foreground outline-none"
          />
          {timer.groupId && (
            <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              Plan
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {isScheduled
            ? `Starts at ${formatTime(timer.startsAt)}`
            : isFinished
              ? 'Time is up'
              : isStopping
                ? 'Press again to confirm stop'
                : `Ends at ${formatTime(timer.endsAt)}`}
        </p>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${
          isScheduled ? 'text-muted' : isFinished ? 'focus-flicker text-danger' : 'text-success'
        }`}
      >
        {isScheduled ? formatElapsed(timer.durationMs) : formatRemaining(remainingMs)}
      </span>
      {isScheduled ? (
        <Button size="sm" variant="ghost" onPress={() => onDismiss(timer.id)}>
          Cancel
        </Button>
      ) : isFinished ? (
        <>
          <Button size="sm" variant="ghost" onPress={() => onDismiss(timer.id)}>
            Dismiss
          </Button>
          <Button size="sm" variant="secondary" onPress={() => onAgain(timer.id)}>
            Again
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant={isStopping ? 'danger' : 'secondary'}
          onPress={() => onRequestStop(timer.id)}
          aria-label={isStopping ? 'Confirm stop timer' : 'Stop timer'}
        >
          {isStopping ? 'Confirm' : 'Stop'}
        </Button>
      )}
    </li>
  )
}

export function FocusModePage(): React.JSX.Element {
  const {
    timers,
    now,
    startTimer,
    requestStop,
    againTimer,
    renameTimer,
    dismissTimer,
    loadHistory,
    rerunTimer,
    getFinishSound,
    setFinishSound,
    planFocus,
    schedulePlan
  } = useFocusMode()
  const [entries, setEntries] = useState<FocusTimerHistoryEntry[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [finishSound, setFinishSoundState] = useState<FocusFinishSound>(DEFAULT_FOCUS_FINISH_SOUND)

  const refresh = useCallback(() => {
    void loadHistory().then(setEntries)
  }, [loadHistory])

  useEffect(() => {
    refresh()
    const interval = window.setInterval(refresh, 15000)
    return () => window.clearInterval(interval)
  }, [refresh, timers.length])

  useEffect(() => {
    if (isSettingsOpen) void getFinishSound().then(setFinishSoundState)
  }, [isSettingsOpen, getFinishSound])

  const groups = groupHistoryByDate(entries)
  const runningNow = timers.filter(
    (timer) => timer.state === 'running' || timer.state === 'stopping'
  ).length

  return (
    <main className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-36 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-success/15 blur-3xl" />
        <div className="absolute right-[8%] top-[22%] size-80 rounded-full bg-success/10 blur-3xl" />
        <div className="absolute bottom-[10%] left-[15%] size-72 rounded-full bg-success/[0.07] blur-3xl" />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:pt-16">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            eyebrow={
              <span className="flex items-center gap-1">
                <Timer size={13} aria-hidden="true" /> Deep work
              </span>
            }
            title="Focus mode"
            description={
              runningNow > 0
                ? `${runningNow} timer${runningNow === 1 ? ' is' : 's are'} running right now.`
                : 'Start a timer and keep a record of every focus session.'
            }
          />
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="mt-1 size-8! rounded-full text-muted hover:text-foreground"
            onPress={() => setIsSettingsOpen(true)}
            aria-label="Focus mode settings"
          >
            <Settings size={16} aria-hidden="true" />
          </Button>
        </div>

        {timers.length > 0 && (
          <section className="mt-8" aria-label="Active timers">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Timers
            </h2>
            <ul className="mt-1 divide-y divide-separator rounded-xl border border-success/30 bg-surface/80 backdrop-blur-sm">
              {timers.map((timer) => (
                <ActiveTimerRow
                  key={timer.id}
                  timer={timer}
                  now={now}
                  onRequestStop={requestStop}
                  onRename={renameTimer}
                  onAgain={againTimer}
                  onDismiss={dismissTimer}
                />
              ))}
            </ul>
          </section>
        )}

        <AddTimerRow onStart={startTimer} />

        <FocusPlanner onPlan={planFocus} onSchedule={schedulePlan} />

        <section className="mt-8" aria-label="Timer history">
          {groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              No previous timers yet.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-6">
                <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {group.label}
                </h2>
                <ul className="mt-1 divide-y divide-separator rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
                  {group.items.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {entry.name ?? 'Focus session'}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatTime(entry.startedAt)} · {formatElapsed(entry.durationMs)} timer ·{' '}
                          {formatElapsed(entry.totalElapsedMs)} focused
                          {entry.state !== 'finished' ? ` · ${entry.state}` : ''}
                        </p>
                      </div>
                      {entry.runCount > 1 && (
                        <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
                          ×{entry.runCount}
                        </span>
                      )}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="size-7! rounded-full text-muted hover:text-foreground"
                        onPress={() => rerunTimer(entry)}
                        aria-label={`Rerun ${entry.name ?? 'timer'}`}
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        {isSettingsOpen && (
          <FocusSettingsModal
            finishSound={finishSound}
            onSelect={(sound) => {
              setFinishSound(sound)
              setFinishSoundState(sound)
            }}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </main>
  )
}
