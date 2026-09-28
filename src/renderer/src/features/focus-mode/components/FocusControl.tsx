import { Clock, Hourglass, Plus, RotateCcw, Square, Timer } from 'lucide-react'
import { Button } from '@heroui/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { FocusTimer } from '../../../../../shared/focus-mode/types'
import { EditableText } from '../../../shared/components/EditableText'
import { useFocusMode } from '../hooks/use-focus-mode'
import { FOCUS_DURATIONS, formatTime, playFinishSound } from '../utils'

const chipSpring = { type: 'spring', bounce: 0.3, duration: 0.4 } as const
const BREATHE_PERIOD_MS = 2400
const URGENT_SECONDS = 4

type ChipState = 'scheduled' | 'finished' | 'stopping' | 'urgent' | 'running'

const CHIP_CLASS: Record<ChipState, string> = {
  scheduled: 'h-6 bg-surface-secondary pl-2.5 pr-3 text-muted transition-colors',
  finished: 'h-6 bg-danger pl-2.5 pr-3 text-white transition-colors',
  stopping: 'h-6 bg-black pl-2.5 pr-3 text-white ring-2 ring-success transition-colors',
  urgent: 'h-6 bg-danger pl-2.5 pr-3 text-white transition-[color,background-color,opacity]',
  running:
    'group h-3.5 w-max max-w-3.5 overflow-hidden bg-success text-white transition-[height,max-width,opacity] duration-300 ease-out hover:h-6 hover:max-w-48 focus-visible:h-6 focus-visible:max-w-48'
}

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function DurationMenu({
  name,
  onSelect,
  onRename
}: {
  name: string | null
  onSelect: (durationMs: number) => void
  onRename: (name: string) => void
}): React.JSX.Element {
  const shortLabel = (durationMs: number): string =>
    durationMs < 60_000
      ? `${durationMs / 1000}s`
      : durationMs < 3_600_000
        ? `${durationMs / 60_000}m`
        : `${durationMs / 3_600_000}h`

  return (
    <div
      data-focus-menu
      className="absolute right-0 top-7 z-50 w-max rounded-xl border border-white/15 bg-black p-1 shadow-overlay"
      role="menu"
      aria-label="Timer options"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="px-1 py-0.5" role="none">
        <EditableText
          value={name}
          placeholder="Unknown timer"
          onSave={onRename}
          className="w-36 truncate rounded-md border border-transparent px-1.5 py-1 text-left text-[11px] font-medium text-white hover:border-white/25"
          inputClassName="w-36 rounded-md border border-white/25 bg-white/10 px-1.5 py-1 text-[11px] font-medium text-white outline-none placeholder:text-white/50"
        />
      </div>
      <div className="mx-2 my-0.5 h-px bg-white/15" role="separator" />
      <div
        className="flex items-center gap-0.5 px-1 py-0.5"
        role="group"
        aria-label="Timer durations"
      >
        <Timer className="mx-0.5 size-3! shrink-0 text-white/50" aria-hidden="true" />
        {FOCUS_DURATIONS.map((duration) => (
          <button
            key={duration.label}
            type="button"
            role="menuitem"
            className="rounded-md px-1.5 py-1 text-[11px] font-medium tabular-nums text-white hover:bg-white/10"
            onClick={() => onSelect(duration.durationMs)}
            aria-label={duration.label}
          >
            {shortLabel(duration.durationMs)}
          </button>
        ))}
      </div>
    </div>
  )
}

function FocusChip({
  timer,
  now,
  onRequestStop,
  onSetDuration,
  onRename,
  onDismiss,
  onAgain,
  onOpenFocusPage,
  onPauseStop,
  onResumeStop,
  onCancelStop
}: {
  timer: FocusTimer
  now: number
  onRequestStop: (id: string) => void
  onSetDuration: (id: string, durationMs: number) => void
  onRename: (id: string, name: string) => void
  onDismiss: (id: string) => void
  onAgain: (id: string) => void
  onOpenFocusPage: () => void
  onPauseStop: (id: string) => void
  onResumeStop: (id: string) => void
  onCancelStop: (id: string) => void
}): React.JSX.Element {
  const chipRef = useRef<HTMLDivElement | null>(null)

  const isScheduled = timer.state === 'scheduled'
  const isStopping = timer.state === 'stopping'
  const isFinished = timer.state === 'finished'
  const remainingSeconds = Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
  const chipState: ChipState = isFinished
    ? 'finished'
    : isScheduled
      ? 'scheduled'
      : isStopping
        ? 'stopping'
        : remainingSeconds <= URGENT_SECONDS
          ? 'urgent'
          : 'running'
  const isUrgent = chipState === 'urgent'
  const holdConfirm = isStopping
  const hasOpenLayer = isStopping

  const reduceMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  const breathing = (chipState === 'running' || isUrgent) && !isHovered && !reduceMotion
  const breathePhase = (now % BREATHE_PERIOD_MS) / BREATHE_PERIOD_MS
  const breathe =
    Math.round((0.55 + 0.45 * (0.5 - 0.5 * Math.cos(breathePhase * Math.PI * 2))) * 1000) / 1000

  useEffect(() => {
    if (!holdConfirm) return
    onPauseStop(timer.id)
    return () => onResumeStop(timer.id)
  }, [holdConfirm, timer.id, onPauseStop, onResumeStop])

  useEffect(() => {
    if (!isStopping) return
    const onPointerDown = (event: PointerEvent): void => {
      if (chipRef.current && !chipRef.current.contains(event.target as Node)) {
        onCancelStop(timer.id)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isStopping, timer.id, onCancelStop])

  const handlePress = (): void => {
    if (isScheduled) {
      onOpenFocusPage()
      return
    }
    if (isFinished) return
    if (isStopping) {
      onCancelStop(timer.id)
      return
    }
    onRequestStop(timer.id)
  }

  return (
    <motion.div
      ref={chipRef}
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={chipSpring}
      className={hasOpenLayer ? 'relative z-50' : 'relative'}
    >
      {hasOpenLayer && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[-1]"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          onPointerDown={() => onCancelStop(timer.id)}
        />
      )}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          isScheduled
            ? 'Scheduled focus timer, press to open focus mode'
            : isFinished
              ? 'Focus timer finished, press for details or double press to dismiss'
              : isStopping
                ? 'Confirm stop focus mode'
                : `Focus session in progress, ${formatRemaining(remainingSeconds)} remaining`
        }
        style={{ opacity: breathing ? breathe : 1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className={`flex shrink-0 cursor-pointer items-center rounded-full ${CHIP_CLASS[chipState]}`}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('button, input')) return
          handlePress()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') handlePress()
        }}
      >
        {isScheduled ? (
          <>
            <Clock className="size-2.5!" aria-hidden="true" />
            <span className="ml-1.5 text-xs font-medium tabular-nums">
              {formatTime(timer.startsAt)}
            </span>
          </>
        ) : isFinished ? (
          <>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="-ml-1 size-4! rounded-full text-white hover:bg-white/15"
              onPress={() => onDismiss(timer.id)}
              aria-label="Stop and remove timer"
            >
              <Square className="size-2.5! fill-current" aria-hidden="true" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-4! rounded-full text-white hover:bg-white/15"
              onPress={() => onAgain(timer.id)}
              aria-label="Rerun timer"
            >
              <RotateCcw className="size-2.5!" aria-hidden="true" />
            </Button>
            {timer.name ? (
              <span className="focus-marquee text-[10px] font-medium">
                <span>{timer.name}</span>
              </span>
            ) : (
              <span className="focus-flicker text-xs font-medium tabular-nums">0:00</span>
            )}
          </>
        ) : (
          <>
            {isStopping && (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="-ml-0.5 mr-1 size-4! rounded-full text-white hover:bg-white/15"
                onPress={() => onRequestStop(timer.id)}
                aria-label="Confirm stop timer"
              >
                <Square className="size-2.5! fill-current" aria-hidden="true" />
              </Button>
            )}
            {isStopping || isUrgent ? (
              <span className="text-xs font-medium tabular-nums">
                {formatRemaining(remainingSeconds)}
              </span>
            ) : (
              <span className="translate-y-1 whitespace-nowrap pl-2.5 pr-3 text-xs font-medium tabular-nums opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-150 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                {formatRemaining(remainingSeconds)}
              </span>
            )}
          </>
        )}
        {isStopping && (
          <DurationMenu
            name={timer.name}
            onSelect={(durationMs) => onSetDuration(timer.id, durationMs)}
            onRename={(name) => onRename(timer.id, name)}
          />
        )}
      </div>
    </motion.div>
  )
}

export function FocusControl({
  isFocusPage,
  onToggleFocusPage
}: {
  isFocusPage: boolean
  onToggleFocusPage: () => void
}): React.JSX.Element {
  const {
    timers,
    now,
    startTimer,
    requestStop,
    setDuration,
    renameTimer,
    pauseStop,
    resumeStop,
    cancelStop,
    dismissTimer,
    againTimer,
    getFinishSound
  } = useFocusMode()
  const knownFinished = useRef<Set<string> | null>(null)

  useEffect(() => {
    const finished = new Set(
      timers.filter((timer) => timer.state === 'finished').map((timer) => timer.id)
    )
    if (knownFinished.current === null) {
      knownFinished.current = finished
      return
    }
    const hasNew = Array.from(finished).some((id) => !knownFinished.current?.has(id))
    knownFinished.current = finished
    if (hasNew && document.visibilityState === 'visible') {
      void getFinishSound().then(playFinishSound)
    }
  }, [timers, getFinishSound])

  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreCloseTimer = useRef<number | undefined>(undefined)
  const openMore = (): void => {
    window.clearTimeout(moreCloseTimer.current)
    setIsMoreOpen(true)
  }
  const closeMore = (): void => {
    moreCloseTimer.current = window.setTimeout(() => setIsMoreOpen(false), 250)
  }
  const [expandArmed, setExpandArmed] = useState(true)
  const [justClosed, setJustClosed] = useState(false)
  const [wasFocusPage, setWasFocusPage] = useState(isFocusPage)
  if (isFocusPage !== wasFocusPage) {
    setWasFocusPage(isFocusPage)
    if (isFocusPage) setExpandArmed(false)
    else setJustClosed(true)
  }
  useEffect(() => {
    if (!justClosed) return
    const timer = window.setTimeout(() => setJustClosed(false), 350)
    return () => window.clearTimeout(timer)
  }, [justClosed])
  const [buttonLock, setButtonLock] = useState(false)
  const lockTimer = useRef<number | undefined>(undefined)
  const armExpand = (): void => {
    if (justClosed || isFocusPage) return
    setExpandArmed(true)
    window.clearTimeout(lockTimer.current)
    setButtonLock(true)
    lockTimer.current = window.setTimeout(() => setButtonLock(false), 320)
  }
  const hiddenTimers = Math.max(0, timers.length - 2)

  return (
    <div className="flex items-center gap-1">
      <div
        className="peer relative flex h-6 w-6 items-center"
        onMouseEnter={armExpand}
        onFocus={armExpand}
      >
        <div
          className={`group/focusbtns absolute left-0 top-0 z-10 flex h-6 w-6 items-center overflow-hidden rounded-full duration-300 ease-out ${
            isFocusPage
              ? 'bg-black text-white ring-2 ring-success transition-[width,background-color,box-shadow]'
              : expandArmed
                ? 'focus-within:w-12 focus-within:bg-success hover:w-12 hover:bg-success transition-[width]'
                : 'transition-[width]'
          }`}
        >
          <div
            className={`flex -translate-x-6 items-center transition-transform duration-300 ease-out ${
              !isFocusPage && expandArmed
                ? 'group-focus-within/focusbtns:translate-x-0 group-hover/focusbtns:translate-x-0'
                : ''
            }`}
          >
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className={`size-6! shrink-0 rounded-full text-muted ${buttonLock ? '' : 'hover:bg-black/20'} ${!isFocusPage && expandArmed ? 'group-focus-within/focusbtns:text-white group-hover/focusbtns:text-white' : ''} ${isFocusPage ? 'pointer-events-none' : ''}`}
              excludeFromTabOrder={isFocusPage}
              aria-hidden={isFocusPage || undefined}
              onPress={(event) => {
                ;(event.target as HTMLElement).blur()
                startTimer()
              }}
              aria-label={
                hiddenTimers > 0
                  ? `Add focus timer, ${hiddenTimers} more not shown`
                  : 'Add focus timer'
              }
            >
              <Plus className="size-3!" aria-hidden="true" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className={`size-6! shrink-0 rounded-full ${isFocusPage ? 'text-white hover:bg-white/10' : `text-muted ${buttonLock ? '' : 'hover:bg-black/20'} ${expandArmed ? 'group-focus-within/focusbtns:text-white group-hover/focusbtns:text-white' : ''}`}`}
              onPress={(event) => {
                ;(event.target as HTMLElement).blur()
                onToggleFocusPage()
              }}
              aria-label={isFocusPage ? 'Back to previous view' : 'Open focus mode'}
            >
              <Hourglass className="size-3!" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      <div
        className={`flex items-center gap-1 transition-transform duration-300 ease-out ${isFocusPage || !expandArmed ? '' : 'peer-focus-within:translate-x-6 peer-hover:translate-x-6'}`}
      >
        {timers.length > 0 && (
          <span className="mx-1 h-3.5 w-px bg-separator" role="separator" aria-hidden="true" />
        )}
        <AnimatePresence initial={false} mode="popLayout">
          {timers.slice(0, 2).map((timer) => (
            <FocusChip
              key={timer.id}
              timer={timer}
              now={now}
              onRequestStop={requestStop}
              onSetDuration={setDuration}
              onRename={renameTimer}
              onDismiss={dismissTimer}
              onAgain={againTimer}
              onOpenFocusPage={onToggleFocusPage}
              onPauseStop={pauseStop}
              onResumeStop={resumeStop}
              onCancelStop={cancelStop}
            />
          ))}
        </AnimatePresence>
        {hiddenTimers > 0 && (
          <div
            className="hover-menu relative flex h-6 cursor-pointer items-center"
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-label={`${hiddenTimers} more focus timers`}
            onMouseEnter={openMore}
            onMouseLeave={closeMore}
            onFocus={openMore}
            onBlur={closeMore}
          >
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums transition-colors ${isMoreOpen ? 'bg-black text-white' : 'text-muted'}`}
            >
              +{hiddenTimers}
            </span>
            {isMoreOpen && (
              <div className="absolute right-0 top-full z-50 pt-1">
                <div
                  className="w-max rounded-xl border border-white/15 bg-black p-1 shadow-overlay"
                  role="menu"
                  aria-label="More focus timers"
                >
                  {timers.slice(2).map((timer) => (
                    <div
                      key={timer.id}
                      className="flex items-center gap-1.5 px-1 py-0.5"
                      role="menuitem"
                    >
                      <EditableText
                        value={timer.name}
                        placeholder="Unknown timer"
                        onSave={(name) => renameTimer(timer.id, name)}
                        className="w-28 truncate rounded-md border border-transparent px-1.5 py-1 text-left text-[11px] font-medium text-white hover:border-white/25"
                        inputClassName="w-28 rounded-md border border-white/25 bg-white/10 px-1.5 py-1 text-[11px] font-medium text-white outline-none placeholder:text-white/50"
                      />
                      <span className="text-[11px] tabular-nums text-white/60">
                        {timer.state === 'scheduled'
                          ? formatTime(timer.startsAt)
                          : formatRemaining(Math.max(0, Math.ceil((timer.endsAt - now) / 1000)))}
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="size-4! rounded-full bg-danger text-white hover:bg-danger/80"
                        onPress={() => dismissTimer(timer.id)}
                        aria-label={`Stop timer ${timer.name ?? ''}`}
                      >
                        <Square className="size-2.5! fill-current" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
