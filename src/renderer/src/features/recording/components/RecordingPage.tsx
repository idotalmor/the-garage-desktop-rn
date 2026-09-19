import {
  ArrowLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  MicAudioLines,
  Pause,
  Play,
  Redo2,
  Square,
  Undo2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { RichTextEditor } from '@heroui-pro/react/rich-text-editor'
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

      <Card className="mt-8 overflow-hidden border-border bg-surface-secondary">
        <Card.Header className="flex-row items-center justify-between gap-4 p-5 pb-4">
          <div>
            <Card.Title>Recording session</Card.Title>
            <Card.Description>
              {isRecording ? 'Recording live' : 'Recording paused'}
            </Card.Description>
          </div>
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {formatDuration(duration)}
          </p>
        </Card.Header>
        <Card.Content className="px-5 pb-5">
          <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-background p-3 sm:gap-3 sm:p-4">
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
            <div
              className="recording-wave flex min-w-0 flex-1 items-center justify-between gap-1 px-2 py-2 sm:px-4"
              aria-label="Recording audio waveform"
              role="img"
            >
              {[18, 28, 40, 24, 34, 20, 44, 26, 36, 18, 30, 22, 38, 26, 34, 20].map(
                (height, index) => (
                  <span
                    key={index}
                    className={isRecording ? 'recording-wave-bar' : 'h-1 rounded-full bg-danger/35'}
                    style={
                      isRecording
                        ? { height: `${height}px`, animationDelay: `${index * 90}ms` }
                        : undefined
                    }
                  />
                )
              )}
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
              <MicAudioLines size={16} aria-hidden="true" />
            </div>
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
          <RichTextEditor
            defaultValue={{ type: 'doc', content: [] }}
            placeholder="Start writing notes..."
            aria-label="Meeting notes"
          >
            <RichTextEditor.Shell className="overflow-hidden rounded-xl border border-border shadow-none">
              <RichTextEditor.Toolbar aria-label="Meeting notes formatting">
                <RichTextEditor.ToolbarGroup>
                  <RichTextEditor.ToggleButton
                    command="bold"
                    isIconOnly
                    aria-label="Bold"
                    tooltip="Bold"
                  >
                    <Bold size={15} aria-hidden="true" />
                  </RichTextEditor.ToggleButton>
                  <RichTextEditor.ToggleButton
                    command="italic"
                    isIconOnly
                    aria-label="Italic"
                    tooltip="Italic"
                  >
                    <Italic size={15} aria-hidden="true" />
                  </RichTextEditor.ToggleButton>
                  <RichTextEditor.ToggleButton
                    command="bulletList"
                    isIconOnly
                    aria-label="Bullet list"
                    tooltip="Bullet list"
                  >
                    <List size={15} aria-hidden="true" />
                  </RichTextEditor.ToggleButton>
                  <RichTextEditor.ToggleButton
                    command="orderedList"
                    isIconOnly
                    aria-label="Numbered list"
                    tooltip="Numbered list"
                  >
                    <ListOrdered size={15} aria-hidden="true" />
                  </RichTextEditor.ToggleButton>
                </RichTextEditor.ToolbarGroup>
                <RichTextEditor.ToolbarSeparator />
                <RichTextEditor.ToolbarGroup>
                  <RichTextEditor.ActionButton
                    action="undo"
                    isIconOnly
                    aria-label="Undo"
                    tooltip="Undo"
                  >
                    <Undo2 size={15} aria-hidden="true" />
                  </RichTextEditor.ActionButton>
                  <RichTextEditor.ActionButton
                    action="redo"
                    isIconOnly
                    aria-label="Redo"
                    tooltip="Redo"
                  >
                    <Redo2 size={15} aria-hidden="true" />
                  </RichTextEditor.ActionButton>
                </RichTextEditor.ToolbarGroup>
              </RichTextEditor.Toolbar>
              <RichTextEditor.Content className="min-h-48 px-4 py-3 text-sm leading-6" />
            </RichTextEditor.Shell>
          </RichTextEditor>
        </Card.Content>
      </Card>
    </main>
  )
}
