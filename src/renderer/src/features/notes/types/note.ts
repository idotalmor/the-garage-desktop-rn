import type { NoteAttachment, NoteReminder } from '../../../../../shared/notes/types'

export type Note = {
  id: string
  body: string
  done: number
  deleted: number
  created_at: number
  attachments: NoteAttachment[]
  reminders: NoteReminder[]
}
