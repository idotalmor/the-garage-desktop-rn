import { Pause, Play, Square } from 'lucide-react'
import { Button } from '@heroui/react'
import { useRecordingStatus } from '../hooks/use-recording'

const waveHeights = [4, 8, 12, 8, 4]

function RecordDotIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" stroke="#9CA3AF" strokeWidth="1" />
      <circle cx="12" cy="12" r="7" fill="#EF4444" />
    </svg>
  )
}

export function RecordingControl({ onOpen }: { onOpen?: () => void }): React.JSX.Element {
  const { status, start, togglePause, stop } = useRecordingStatus()

  if (status.state === 'idle') {
    return (
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-7 rounded-full"
        onPress={() => {
          start()
          onOpen?.()
        }}
        aria-label="Start recording"
      >
        <RecordDotIcon />
      </Button>
    )
  }

  const isRecording = status.state === 'recording'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Open recording"
      className="flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-danger pl-2.5 pr-0.5 text-white"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) return
        onOpen?.()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen?.()
      }}
    >
      <div className="flex h-3 items-center gap-0.5" aria-hidden="true">
        {waveHeights.map((height, index) => (
          <span
            key={index}
            className={
              isRecording ? 'recording-wave-bar-white' : 'h-0.5 w-0.5 rounded-full bg-white/60'
            }
            style={
              isRecording ? { height: `${height}px`, animationDelay: `${index * 90}ms` } : undefined
            }
          />
        ))}
      </div>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-4 rounded-full text-white hover:bg-white/15"
        onPress={togglePause}
        aria-label={isRecording ? 'Pause recording' : 'Resume recording'}
      >
        {isRecording ? (
          <Pause size={9} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        ) : (
          <Play size={9} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        )}
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-4 rounded-full text-white hover:bg-white/15"
        onPress={stop}
        aria-label="Stop recording"
      >
        <Square size={8} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </Button>
    </div>
  )
}
