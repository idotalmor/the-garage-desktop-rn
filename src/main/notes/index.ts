import { ipcMain } from 'electron'
import { NotesChannel } from '../../shared/notes/channels'
import { addNote, deleteNote, listNotes, toggleNote } from './repository'

export function initNotesIpc(): void {
  ipcMain.handle(NotesChannel.List, (_, options?: { done?: boolean }) => listNotes(options))
  ipcMain.handle(NotesChannel.Add, (_, body: string) => addNote(body))
  ipcMain.handle(NotesChannel.Toggle, (_, id: string) => toggleNote(id))
  ipcMain.handle(NotesChannel.Delete, (_, id: string) => deleteNote(id))
}
