import { ArrowLeft, MicAudioLines } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { MeetingNotesEditor } from './MeetingNotesEditor'

type RecordingPageProps = {
  onBack: () => void
}

type Recording = {
  id: number
  title: string
  duration: number
}

const waveformHeights = Array.from({ length: 96 }, (_, index) => 6 + ((index * 7) % 13))

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`
}

function RecordingWaveform({ isRecording }: { isRecording: boolean }): React.JSX.Element {
  return (
    <div
      className="recording-wave flex h-5 min-w-0 flex-1 items-center justify-between gap-0.5"
      aria-label="Recording audio waveform"
      role="img"
    >
      {waveformHeights.map((height, index) => (
        <span
          key={index}
          className={isRecording ? 'recording-wave-bar' : 'h-1 rounded-full bg-danger/35'}
          style={
            isRecording ? { height: `${height}px`, animationDelay: `${index * 30}ms` } : undefined
          }
        />
      ))}
    </div>
  )
}

function RecordingCard({
  duration,
  isRecording,
  onStop,
  onTogglePause
}: {
  duration: number
  isRecording: boolean
  onStop: () => void
  onTogglePause: () => void
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-2xl bg-black p-3 text-white sm:p-4">
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-4 shrink-0s rounded-sm border-0 bg-danger p-0 hover:bg-danger/85"
        onPress={onStop}
        aria-label="Stop recording"
      />
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-6 shrink-0 rounded-sm border-0 p-0 text-white hover:bg-white/10"
        onPress={onTogglePause}
        aria-label={isRecording ? 'Pause recording' : 'Resume recording'}
      >
        {isRecording ? (
          <span className="flex items-center gap-0.5" aria-hidden="true">
            <span className="h-3 w-1 rounded-[1px] bg-current" />
            <span className="h-3 w-1 rounded-[1px] bg-current" />
          </span>
        ) : (
          <span
            className="ml-0.5 border-y-[4px] border-l-[6px] border-y-transparent border-l-current"
            aria-hidden="true"
          />
        )}
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-2 sm:px-4">
        <RecordingWaveform isRecording={isRecording} />
        <p className="shrink-0 font-mono text-xs tabular-nums text-white/65">
          {formatDuration(duration)}
        </p>
      </div>
    </div>
  )
}

function SavedRecordingCard({
  recording,
  isPlaying,
  onPlay
}: {
  recording: Recording
  isPlaying: boolean
  onPlay: () => void
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-danger p-3 text-danger-foreground shadow-sm">
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-7 shrink-0 rounded-md bg-white/15 text-danger-foreground hover:bg-white/25"
        onPress={onPlay}
        aria-label={isPlaying ? `Pause ${recording.title}` : `Play ${recording.title}`}
      >
        <span
          className={
            isPlaying
              ? 'flex items-center gap-0.5'
              : 'ml-0.5 border-y-[4px] border-l-[6px] border-y-transparent border-l-current'
          }
          aria-hidden="true"
        >
          {isPlaying && (
            <>
              <span className="h-3 w-1 rounded-[1px] bg-current" />
              <span className="h-3 w-1 rounded-[1px] bg-current" />
            </>
          )}
        </span>
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{recording.title}</p>
        <p className="mt-0.5 font-mono text-xs tabular-nums text-danger-foreground/70">
          {formatDuration(recording.duration)}
        </p>
      </div>
    </div>
  )
}

export function RecordingPage({ onBack }: RecordingPageProps): React.JSX.Element {
  const [isRecording, setIsRecording] = useState(true)
  const [duration, setDuration] = useState(0)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [playingId, setPlayingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isRecording) return
    const timer = window.setInterval(() => setDuration((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isRecording])

  const finishRecording = (): void => {
    setIsRecording(false)
    setRecordings((current) => [
      ...current,
      {
        id: Date.now(),
        title: `Meeting recording ${current.length + 1}`,
        duration
      }
    ])
  }

  const startRecording = (): void => {
    setDuration(0)
    setIsRecording(true)
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-14 sm:px-6 lg:pt-16">
      <Button
        size="sm"
        variant="ghost"
        className="mb-6 -ml-2 rounded-lg text-muted"
        onPress={onBack}
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back
      </Button>

      <div className="mb-8">
        <div className="flex min-w-0 flex-wrap items-start gap-2 sm:flex-nowrap sm:gap-3">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-8 shrink-0 rounded-md bg-danger text-danger-foreground hover:bg-danger/85"
            onPress={startRecording}
            aria-label="Start a new recording"
          >
            <MicAudioLines size={15} aria-hidden="true" />
          </Button>
          <div className="min-w-0 flex-1">
            {isRecording && (
              <RecordingCard
                duration={duration}
                isRecording={isRecording}
                onStop={finishRecording}
                onTogglePause={() => setIsRecording((recording) => !recording)}
              />
            )}
          </div>
          {recordings.length > 0 && (
            <aside className="w-full shrink-0 space-y-2 sm:w-64" aria-label="Saved recordings">
              {recordings.map((recording) => (
                <SavedRecordingCard
                  key={recording.id}
                  recording={recording}
                  isPlaying={playingId === recording.id}
                  onPlay={() =>
                    setPlayingId((current) => (current === recording.id ? null : recording.id))
                  }
                />
              ))}
            </aside>
          )}
        </div>
      </div>

      <PageHeader
        eyebrow="Meeting capture"
        title="Record a meeting"
        description="Keep the conversation and your notes together in one session."
      />

      <section className="mt-8" aria-label="Meeting notes">
        <MeetingNotesEditor />
      </section>
    </main>
  )
}
