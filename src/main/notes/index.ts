import { ipcMain } from 'electron'
import { NotesChannel } from '../../shared/notes/channels'
import type { NewNoteReminder, NoteAttachment, NoteStatus } from '../../shared/notes/types'
import {
  addNote,
  addReminder,
  deleteNote,
  listNotes,
  removeReminder,
  restoreNote,
  toggleNote
} from './repository'
import { startReminderScheduler } from './reminders'

export function initNotesIpc(): void {
  startReminderScheduler()

  ipcMain.handle(NotesChannel.List, (_, options?: { status?: NoteStatus }) => listNotes(options))
  ipcMain.handle(
    NotesChannel.Add,
    (
      _,
      payload:
        string | { body: string; attachments: NoteAttachment[]; reminders?: NewNoteReminder[] }
    ) =>
      typeof payload === 'string'
        ? addNote(payload)
        : addNote(payload.body, payload.attachments, payload.reminders)
  )
  ipcMain.handle(NotesChannel.Toggle, (_, id: string) => toggleNote(id))
  ipcMain.handle(NotesChannel.Delete, (_, id: string) => deleteNote(id))
  ipcMain.handle(NotesChannel.Restore, (_, id: string) => restoreNote(id))
  ipcMain.handle(
    NotesChannel.AddReminder,
    (_, payload: { noteId: string; remindAt: number; days?: number[] }) =>
      addReminder(payload.noteId, payload.remindAt, payload.days)
  )
  ipcMain.handle(NotesChannel.RemoveReminder, (_, id: string) => removeReminder(id))
}
