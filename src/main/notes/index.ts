import { ipcMain } from 'electron'
import { NotesChannel } from '../../shared/notes/channels'
import type { NoteAttachment, NoteStatus } from '../../shared/notes/types'
import { addNote, deleteNote, listNotes, restoreNote, toggleNote } from './repository'

export function initNotesIpc(): void {
  ipcMain.handle(NotesChannel.List, (_, options?: { status?: NoteStatus }) => listNotes(options))
  ipcMain.handle(
    NotesChannel.Add,
    (_, payload: string | { body: string; attachments: NoteAttachment[] }) =>
      typeof payload === 'string' ? addNote(payload) : addNote(payload.body, payload.attachments)
  )
  ipcMain.handle(NotesChannel.Toggle, (_, id: string) => toggleNote(id))
  ipcMain.handle(NotesChannel.Delete, (_, id: string) => deleteNote(id))
  ipcMain.handle(NotesChannel.Restore, (_, id: string) => restoreNote(id))
}
