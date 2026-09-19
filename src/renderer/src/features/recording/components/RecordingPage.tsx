import { ArrowLeft, Pause, Play, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { MeetingNotesEditor } from './MeetingNotesEditor'

type RecordingPageProps = {
  onBack: () => void
}

const waveformHeights = Array.from({ length: 64 }, (_, index) => 8 + ((index * 7) % 15))

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`
}

export function RecordingPage({ onBack }: RecordingPageProps): React.JSX.Element {
  const [isRecording, setIsRecording] = useState(true)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!isRecording) return
    const timer = window.setInterval(() => setDuration((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isRecording])

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
        <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-surface-secondary p-3 sm:gap-3 sm:p-4">
          <Button
            isIconOnly
            size="sm"
            variant="danger-soft"
            className="size-9 shrink-0 rounded-full"
            onPress={() => setIsRecording(false)}
            aria-label="Stop recording"
          >
            <Square size={15} aria-hidden="true" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            className="size-9 shrink-0 rounded-full"
            onPress={() => setIsRecording((recording) => !recording)}
            aria-label={isRecording ? 'Pause recording' : 'Resume recording'}
          >
            {isRecording ? (
              <Pause size={15} aria-hidden="true" />
            ) : (
              <Play size={15} aria-hidden="true" />
            )}
          </Button>
          <div className="min-w-0 flex-1 px-2 sm:px-4">
            <div
              className="recording-wave flex h-5 w-full items-center justify-between gap-0.5"
              aria-label="Recording audio waveform"
              role="img"
            >
              {waveformHeights.map((height, index) => (
                <span
                  key={index}
                  className={isRecording ? 'recording-wave-bar' : 'h-1 rounded-full bg-danger/35'}
                  style={
                    isRecording
                      ? { height: `${height}px`, animationDelay: `${index * 45}ms` }
                      : undefined
                  }
                />
              ))}
            </div>
            <p className="mt-1 text-left font-mono text-xs tabular-nums text-muted">
              {formatDuration(duration)}
            </p>
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
