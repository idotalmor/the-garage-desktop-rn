import { useEffect, useState } from 'react'
import { Button, Card, Input } from '@heroui/react'
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
      <Card className="w-full max-w-3xl mx-auto p-4 sm:p-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Notes</h1>
        <div className="mt-4 flex items-start gap-2">
          <Input
            aria-label="Note"
            placeholder="Write a note..."
            value={input}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInput(event.target.value)}
            className="flex-1"
          />
          <Button isDisabled={!input.trim()} onPress={() => add(input)}>
            Add
          </Button>
        </div>
        <ul className="mt-6 space-y-3">
          {notes.length === 0 && (
            <li className="text-sm text-muted">No undone notes. Add one above.</li>
          )}
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <span className="text-sm">{note.body}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onPress={() => toggle(note.id)}>
                  Done
                </Button>
                <Button size="sm" variant="ghost" onPress={() => remove(note.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  )
}
