import { Pause, Play, Square } from 'lucide-react'
import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'motion/react'
import { useRecordingStatus } from '../hooks/use-recording'

const waveHeights = [4, 8, 12, 8, 4, 8, 12, 8, 4, 8, 12, 8]

function RecordDotIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="size-4!" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" stroke="#9CA3AF" strokeWidth="1" />
      <circle cx="12" cy="12" r="7" fill="#EF4444" />
    </svg>
  )
}

export function RecordingControl({ onOpen }: { onOpen?: () => void }): React.JSX.Element {
  const { status, start, togglePause, stop } = useRecordingStatus()
  const isRecording = status.state === 'recording'

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {status.state === 'idle' ? (
        <motion.div
          key="start"
          layoutId="recording-control"
          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        >
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-7! rounded-full"
            onPress={() => {
              start()
              onOpen?.()
            }}
            aria-label="Start recording"
          >
            <RecordDotIcon />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="chip"
          layoutId="recording-control"
          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        >
          <div
            role="button"
            tabIndex={0}
            aria-label="Open recording"
            className="flex h-6 shrink-0 cursor-pointer items-center rounded-full bg-danger pl-0.5 pr-2.5 text-white"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('button')) return
              onOpen?.()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onOpen?.()
            }}
          >
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-5! rounded-full text-white hover:bg-white/15"
              onPress={stop}
              aria-label="Stop recording"
            >
              <Square
                className="size-2.5!"
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
              />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-5! rounded-full text-white hover:bg-white/15"
              onPress={togglePause}
              aria-label={isRecording ? 'Pause recording' : 'Resume recording'}
            >
              {isRecording ? (
                <Pause className="size-3!" fill="currentColor" strokeWidth={0} aria-hidden="true" />
              ) : (
                <Play className="size-3!" fill="currentColor" strokeWidth={0} aria-hidden="true" />
              )}
            </Button>

            <div className="flex h-3 items-center gap-0.5" aria-hidden="true">
              {waveHeights.map((height, index) => (
                <span
                  key={index}
                  className={
                    isRecording
                      ? 'recording-wave-bar-white'
                      : 'h-0.5 w-0.5 rounded-full bg-white/60'
                  }
                  style={
                    isRecording
                      ? { height: `${height}px`, animationDelay: `${index * 90}ms` }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
