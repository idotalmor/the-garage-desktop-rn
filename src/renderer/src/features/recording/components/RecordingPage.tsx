import { ArrowLeft, MicAudioLines, Pause, Play, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { PageHeader } from '../../../shared/components/PageHeader'

type RecordingPageProps = {
  onBack: () => void
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`
}

export function RecordingPage({ onBack }: RecordingPageProps): React.JSX.Element {
  const [isRecording, setIsRecording] = useState(true)
  const [duration, setDuration] = useState(0)
  const [notes, setNotes] = useState('')

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

      <PageHeader
        eyebrow="Meeting capture"
        title="Record a meeting"
        description="Keep the conversation and your notes together in one session."
      />

      <Card className="mt-8 overflow-hidden border-danger/25">
        <Card.Content className="relative flex flex-col items-center px-6 py-10 text-center sm:py-14">
          <div className="recording-halo absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger/5" />
          <div
            className={`relative flex size-24 items-center justify-center rounded-full ${isRecording ? 'recording-pulse bg-danger text-danger-foreground' : 'bg-danger/15 text-danger'}`}
          >
            <MicAudioLines size={38} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <p className="relative mt-6 text-xs font-medium uppercase tracking-[0.18em] text-danger">
            {isRecording ? 'Recording live' : 'Recording paused'}
          </p>
          <p className="relative mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight">
            {formatDuration(duration)}
          </p>
          <div
            className="recording-wave relative mt-6 flex h-8 items-center gap-1"
            aria-hidden="true"
          >
            {[18, 28, 40, 24, 34, 20, 44, 26, 36, 18, 30].map((height, index) => (
              <span
                key={index}
                className={isRecording ? 'recording-wave-bar' : 'h-1 rounded-full bg-danger/35'}
                style={
                  isRecording
                    ? { height: `${height}px`, animationDelay: `${index * 90}ms` }
                    : undefined
                }
              />
            ))}
          </div>
          <div className="relative mt-8 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-lg"
              onPress={() => setIsRecording((recording) => !recording)}
            >
              {isRecording ? (
                <Pause size={15} aria-hidden="true" />
              ) : (
                <Play size={15} aria-hidden="true" />
              )}
              {isRecording ? 'Pause' : 'Resume'}
            </Button>
            <Button
              size="sm"
              variant="danger-soft"
              className="rounded-lg"
              onPress={() => setIsRecording(false)}
            >
              <Square size={14} aria-hidden="true" />
              Finish session
            </Button>
          </div>
        </Card.Content>
      </Card>

      <Card className="mt-6">
        <Card.Header className="p-6 pb-3">
          <Card.Title>Meeting notes</Card.Title>
          <Card.Description>
            Write down decisions, questions, and follow-ups while you listen.
          </Card.Description>
        </Card.Header>
        <Card.Content className="px-6 pb-6">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Start writing notes..."
            aria-label="Meeting notes"
            className="min-h-48 w-full resize-y rounded-xl border border-border bg-surface-secondary p-4 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </Card.Content>
      </Card>
    </main>
  )
}
