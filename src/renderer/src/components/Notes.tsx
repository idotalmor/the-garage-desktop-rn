import { useEffect, useState } from 'react'
import { Button, Card, Input, Label, TextField } from '@heroui/react'
import { NotesChannel } from '../../../shared/notes/channels'

type Note = {
  id: string
  body: string
  done: number
  created_at: number
}

function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [input, setInput] = useState('')

  const refresh = async (): Promise<void> => {
    const list = (await window.electron.ipcRenderer.invoke(NotesChannel.List, {
      done: false
    })) as Note[]
    setNotes(list)
  }

  useEffect(() => {
    refresh()
  }, [])

  const add = async (body: string): Promise<void> => {
    const trimmed = body.trim()
    if (!trimmed) return
    await window.electron.ipcRenderer.invoke(NotesChannel.Add, trimmed)
    setInput('')
    await refresh()
  }

  const toggle = async (id: string): Promise<void> => {
    await window.electron.ipcRenderer.invoke(NotesChannel.Toggle, id)
    await refresh()
  }

  const remove = async (id: string): Promise<void> => {
    await window.electron.ipcRenderer.invoke(NotesChannel.Delete, id)
    await refresh()
  }

  return { notes, input, setInput, add, toggle, remove }
}

export function Notes(): React.JSX.Element {
  const { notes, input, setInput, add, toggle, remove } = useNotes()

  return (
    <main className="p-4 sm:p-6">
      <Card className="w-full max-w-3xl mx-auto">
        <Card.Header>
          <Card.Title className="text-xl sm:text-2xl">Notes</Card.Title>
          <Card.Description>Capture quick thoughts and mark them done.</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-6">
          <div className="flex items-end gap-3">
            <TextField
              value={input}
              onChange={(value: string) => setInput(value)}
              className="flex-1"
            >
              <Label>New note</Label>
              <Input placeholder="What do you want to remember?" />
            </TextField>
            <Button isDisabled={!input.trim()} onPress={() => add(input)}>
              Add
            </Button>
          </div>

          {notes.length === 0 ? (
            <p className="text-center text-sm text-muted">No undone notes. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} className="w-full">
                  <Card.Content className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm">{note.body}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" variant="outline" onPress={() => toggle(note.id)}>
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-(--danger)"
                        onPress={() => remove(note.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </main>
  )
}
