import { ArrowLeft, MicAudioLines, Pause, Play, Square } from 'lucide-react'
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

type PendingRecording = {
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
    <div className="flex min-h-16 min-w-0 items-center gap-1 rounded-2xl bg-black p-3 text-white sm:p-4">
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-6 shrink-0 rounded-sm border-0 bg-danger p-0 text-danger-foreground hover:bg-danger/85"
        onPress={onStop}
        aria-label="Stop recording"
      >
        <Square size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-6 shrink-0 rounded-sm border-0 p-0 text-white hover:bg-white/10"
        onPress={onTogglePause}
        aria-label={isRecording ? 'Pause recording' : 'Resume recording'}
      >
        {isRecording ? (
          <Pause size={12} fill="currentColor" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Play size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
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
    <div className="flex w-40 shrink-0 items-center gap-2 rounded-xl bg-black p-2.5 text-white">
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="size-6 shrink-0 rounded-md bg-white/10 text-white hover:bg-white/20"
        onPress={onPlay}
        aria-label={isPlaying ? `Pause ${recording.title}` : `Play ${recording.title}`}
      >
        {isPlaying ? (
          <Pause size={11} fill="currentColor" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        )}
      </Button>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{recording.title}</p>
        <p className="mt-0.5 font-mono text-[10px] tabular-nums text-white/55">
          {formatDuration(recording.duration)}
        </p>
      </div>
    </div>
  )
}

function PendingRecordingCard({
  recording,
  onTitleChange,
  onSave
}: {
  recording: PendingRecording
  onTitleChange: (title: string) => void
  onSave: () => void
}): React.JSX.Element {
  return (
    <div className="flex min-h-16 min-w-0 items-center gap-2 rounded-2xl bg-black p-3 text-white sm:gap-3 sm:p-4">
      <label htmlFor="recording-name" className="shrink-0 text-xs text-white/55">
        Name:
      </label>
      <input
        id="recording-name"
        value={recording.title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Meeting recording"
        aria-label="Recording name"
        className="h-8 min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-danger"
        autoFocus
      />
      <p className="shrink-0 font-mono text-xs tabular-nums text-white/55">
        {formatDuration(recording.duration)}
      </p>
      <Button
        size="sm"
        variant="danger"
        className="h-8 shrink-0 rounded-md px-3 text-xs"
        onPress={onSave}
        isDisabled={!recording.title.trim()}
      >
        Save
      </Button>
    </div>
  )
}

export function RecordingPage({ onBack }: RecordingPageProps): React.JSX.Element {
  const [isRecording, setIsRecording] = useState(true)
  const [duration, setDuration] = useState(0)
  const [pendingRecording, setPendingRecording] = useState<PendingRecording | null>(null)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [playingId, setPlayingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isRecording) return
    const timer = window.setInterval(() => setDuration((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isRecording])

  const finishRecording = (): void => {
    setIsRecording(false)
    setPendingRecording({
      id: Date.now(),
      title: '',
      duration
    })
  }

  const saveRecording = (): void => {
    if (!pendingRecording?.title.trim()) return
    setRecordings((current) => [
      ...current,
      { ...pendingRecording, title: pendingRecording.title.trim() }
    ])
    setPendingRecording(null)
  }

  const startRecording = (): void => {
    if (pendingRecording) return
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
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          {!isRecording && !pendingRecording && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-8 shrink-0 rounded-full bg-danger text-danger-foreground hover:bg-danger/85"
              onPress={startRecording}
              aria-label="Start a new recording"
            >
              <MicAudioLines size={15} aria-hidden="true" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            {isRecording && (
              <RecordingCard
                duration={duration}
                isRecording={isRecording}
                onStop={finishRecording}
                onTogglePause={() => setIsRecording((recording) => !recording)}
              />
            )}
            {!isRecording && pendingRecording && (
              <PendingRecordingCard
                recording={pendingRecording}
                onTitleChange={(title) =>
                  setPendingRecording((current) => current && { ...current, title })
                }
                onSave={saveRecording}
              />
            )}
            {recordings.length > 0 && (
              <div
                className="mt-3 rounded-2xl bg-surface-secondary p-3"
                aria-label="Saved recordings"
              >
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            )}
          </div>
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
