import { useCallback, useEffect, useState } from 'react'
import { NotesChannel } from '../../../../../shared/notes/channels'
import type {
  NewNoteReminder,
  NoteAttachment,
  NoteReminder,
  NoteStatus
} from '../../../../../shared/notes/types'
import type { Note } from '../types/note'

function normalizeNote(note: Note): Note {
  return {
    ...note,
    done: note.done === 1 ? 1 : 0,
    deleted: note.deleted === 1 ? 1 : 0,
    attachments: Array.isArray(note.attachments) ? note.attachments : [],
    reminders: (Array.isArray(note.reminders) ? note.reminders : []).map((reminder) => ({
      ...reminder,
      days: Array.isArray(reminder.days) ? reminder.days : []
    }))
  }
}

export function useNotes(): {
  notes: Note[]
  input: string
  status: NoteStatus
  setInput: (value: string) => void
  setStatus: (value: NoteStatus) => void
  add: (attachments?: NoteAttachment[], reminders?: NewNoteReminder[]) => Promise<void>
  toggle: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  restore: (id: string) => Promise<void>
  addReminder: (noteId: string, remindAt: number, days: number[]) => Promise<void>
  removeReminder: (noteId: string, reminderId: string) => Promise<void>
} {
  const [notes, setNotes] = useState<Note[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<NoteStatus>('open')

  const loadNotes = useCallback(() => {
    let cancelled = false
    window.electron.ipcRenderer.invoke(NotesChannel.List).then((list) => {
      if (!cancelled) setNotes((list as Note[]).map(normalizeNote))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => loadNotes(), [loadNotes])

  const add = async (
    attachments: NoteAttachment[] = [],
    reminders: NewNoteReminder[] = []
  ): Promise<void> => {
    const trimmed = input.trim()
    if (!trimmed && attachments.length === 0) return
    const created = (await window.electron.ipcRenderer.invoke(NotesChannel.Add, {
      body: trimmed,
      attachments,
      reminders
    })) as Note
    setInput('')
    setNotes((current) => [
      normalizeNote(created),
      ...current.filter((note) => note.id !== created.id)
    ])
  }

  const toggle = async (id: string): Promise<void> => {
    const result = (await window.electron.ipcRenderer.invoke(NotesChannel.Toggle, id)) as {
      id: string
      done: number
    }
    setNotes((current) =>
      current.map((note) => (note.id === result.id ? { ...note, done: result.done } : note))
    )
  }

  const remove = async (id: string): Promise<void> => {
    const result = (await window.electron.ipcRenderer.invoke(NotesChannel.Delete, id)) as {
      id: string
    }
    setNotes((current) =>
      current.map((note) => (note.id === result.id ? { ...note, deleted: 1 } : note))
    )
  }

  const restore = async (id: string): Promise<void> => {
    const result = (await window.electron.ipcRenderer.invoke(NotesChannel.Restore, id)) as {
      id: string
    }
    setNotes((current) =>
      current.map((note) => (note.id === result.id ? { ...note, deleted: 0 } : note))
    )
  }

  const addReminder = async (noteId: string, remindAt: number, days: number[]): Promise<void> => {
    const reminder = (await window.electron.ipcRenderer.invoke(NotesChannel.AddReminder, {
      noteId,
      remindAt,
      days
    })) as NoteReminder
    setNotes((current) =>
      current.map((note) =>
        note.id === noteId
          ? {
              ...note,
              reminders: [...note.reminders, reminder].sort((a, b) => a.remind_at - b.remind_at)
            }
          : note
      )
    )
  }

  const removeReminder = async (noteId: string, reminderId: string): Promise<void> => {
    await window.electron.ipcRenderer.invoke(NotesChannel.RemoveReminder, reminderId)
    setNotes((current) =>
      current.map((note) =>
        note.id === noteId
          ? { ...note, reminders: note.reminders.filter((reminder) => reminder.id !== reminderId) }
          : note
      )
    )
  }

  return {
    notes,
    input,
    status,
    setInput,
    setStatus,
    add,
    toggle,
    remove,
    restore,
    addReminder,
    removeReminder
  }
}
