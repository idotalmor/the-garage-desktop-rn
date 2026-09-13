import {
  Archive,
  ArrowUp,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  Paperclip,
  Trash2,
  X
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Chip, Table } from '@heroui/react'
import { PromptInput } from '@heroui-pro/react'
import ReactMarkdown from 'react-markdown'
import { useNotes } from '../hooks/useNotes'
import type { NoteAttachment, NoteStatus } from '../../../../../shared/notes/types'
import { PageHeader } from '../../../shared/components/PageHeader'

type NoteFilter = NoteStatus

type FilterItem = {
  id: NoteFilter
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const filterItems: FilterItem[] = [
  { id: 'open', label: 'Open notes', icon: Circle },
  { id: 'finished', label: 'Finished notes', icon: CheckCircle2 },
  { id: 'deleted', label: 'Deleted notes', icon: Archive }
]

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(timestamp)
}

export function NotesPage(): React.JSX.Element {
  const { notes, input, status, setInput, setStatus, add, toggle, remove, restore } = useNotes()
  const [files, setFiles] = useState<File[]>([])
  const [selectedAttachment, setSelectedAttachment] = useState<NoteAttachment | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (fileList: FileList | null): void => {
    if (!fileList) return
    const incoming = Array.from(fileList)
    setFiles((current) => [
      ...current,
      ...incoming.filter(
        (file) =>
          !current.some(
            (existing) =>
              existing.name === file.name &&
              existing.size === file.size &&
              existing.lastModified === file.lastModified
          )
      )
    ])
  }

  const submit = async (): Promise<void> => {
    const attachments = await Promise.all(
      files.map(async (file): Promise<NoteAttachment> => ({
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        content: await file.text()
      }))
    )
    await add(attachments)
    setFiles([])
  }

  const setFilter = (filter: NoteFilter): void => {
    setStatus(filter)
  }

  const visibleNotes = notes.filter((note) => {
    if (status === 'deleted') return note.deleted === 1
    if (status === 'finished') return note.deleted !== 1 && note.done === 1
    return note.deleted !== 1 && note.done !== 1
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:px-6 lg:pt-16">
      <PageHeader
        eyebrow="Workspace notes"
        title="Notes"
        description="Capture ideas, context, and follow-ups without losing the thread."
      />
      <section
        className={`mx-auto mt-8 max-w-3xl rounded-2xl transition-colors ${isDragging ? 'bg-accent/10' : ''}`}
        aria-label="Add a note"
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          addFiles(event.dataTransfer.files)
        }}
      >
        <PromptInput value={input} onValueChange={setInput} onSubmit={submit} className="w-full">
          <PromptInput.Shell className="border border-border shadow-none">
            {files.length > 0 && (
              <PromptInput.Attachments className="flex flex-wrap gap-2 px-4 pt-4">
                {files.map((file) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="flex items-center gap-2 rounded-lg bg-surface-secondary px-2.5 py-1.5 text-xs"
                  >
                    <FileText size={14} className="text-muted" aria-hidden="true" />
                    <span className="max-w-48 truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-muted hover:text-foreground"
                      onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </PromptInput.Attachments>
            )}
            <PromptInput.Content>
              <PromptInput.TextArea
                className="min-h-32"
                placeholder="Write a note, drop files, or add context..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault()
                    submit()
                  }
                }}
              />
            </PromptInput.Content>
            <PromptInput.Toolbar>
              <PromptInput.ToolbarStart>
                <PromptInput.Action
                  aria-label="Attach files"
                  tooltip="Attach files"
                  onPress={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={16} aria-hidden="true" />
                </PromptInput.Action>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    addFiles(event.target.files)
                    event.target.value = ''
                  }}
                />
                {isDragging && <span className="text-xs text-accent">Drop files to attach</span>}
              </PromptInput.ToolbarStart>
              <PromptInput.ToolbarEnd>
                <PromptInput.Send
                  isDisabled={!input.trim() && files.length === 0}
                  aria-label="Add note"
                >
                  <ArrowUp size={16} aria-hidden="true" />
                </PromptInput.Send>
              </PromptInput.ToolbarEnd>
            </PromptInput.Toolbar>
          </PromptInput.Shell>
        </PromptInput>
      </section>

      <section className="mt-10" aria-label="Notes">
        <div className="mb-4 flex items-center justify-end gap-3">
          <Chip size="sm" variant="soft" className="rounded-full">
            <span className="tabular-nums">{visibleNotes.length}</span> {status}
          </Chip>
          <div className="flex gap-1 rounded-full bg-surface-secondary p-1">
            {filterItems.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                isIconOnly
                size="sm"
                variant={status === id ? 'secondary' : 'ghost'}
                className="rounded-full"
                onPress={() => setFilter(id)}
                aria-label={label}
              >
                <Icon size={14} aria-hidden="true" />
              </Button>
            ))}
          </div>
        </div>

        {visibleNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Check size={22} aria-hidden="true" />
            </div>
            <p className="mt-4 font-medium">
              {status === 'open'
                ? 'You’re all caught up'
                : status === 'finished'
                  ? 'No finished notes'
                  : 'No deleted notes'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {status === 'open'
                ? 'New notes will appear here.'
                : status === 'finished'
                  ? 'Finished notes will appear here.'
                  : 'Deleted notes will appear here.'}
            </p>
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={`${status} notes`} className="min-w-[720px]">
                <Table.Header>
                  <Table.Column isRowHeader>Note</Table.Column>
                  <Table.Column>Added</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Files</Table.Column>
                  <Table.Column className="text-end">Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {visibleNotes.map((note) => (
                    <Table.Row key={note.id} id={note.id}>
                      <Table.Cell className="max-w-[32rem] whitespace-normal font-medium">
                        {note.body}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-muted">
                        {formatDate(note.created_at)}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={
                            note.deleted === 1 ? 'danger' : note.done === 1 ? 'success' : 'warning'
                          }
                          size="sm"
                          variant="soft"
                        >
                          {note.deleted === 1 ? 'Deleted' : note.done === 1 ? 'Finished' : 'Open'}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        {note.attachments.length > 0 ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => setSelectedAttachment(note.attachments[0])}
                            aria-label={`View ${note.attachments.length} attached file${note.attachments.length === 1 ? '' : 's'}`}
                          >
                            <Paperclip size={14} aria-hidden="true" />
                            {note.attachments.length}
                          </Button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            onPress={() =>
                              note.deleted === 1 ? restore(note.id) : toggle(note.id)
                            }
                            aria-label={
                              note.deleted === 1
                                ? 'Restore note'
                                : note.done === 1
                                  ? 'Reopen note'
                                  : 'Finish note'
                            }
                          >
                            <Check size={16} aria-hidden="true" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="danger-soft"
                            onPress={() => remove(note.id)}
                            aria-label="Delete note"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </section>

      {selectedAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attachment-title"
          onClick={() => setSelectedAttachment(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-overlay shadow-overlay"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-separator px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText size={18} className="shrink-0 text-accent" aria-hidden="true" />
                <h2 id="attachment-title" className="truncate font-medium">
                  {selectedAttachment.name}
                </h2>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => setSelectedAttachment(null)}
                aria-label="Close attachment preview"
              >
                <X size={16} aria-hidden="true" />
              </Button>
            </header>
            <div className="min-h-0 overflow-auto p-5 sm:p-8">
              {selectedAttachment.name.toLowerCase().endsWith('.md') ||
              selectedAttachment.type === 'text/markdown' ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{selectedAttachment.content}</ReactMarkdown>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-muted">
                  {selectedAttachment.content}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
