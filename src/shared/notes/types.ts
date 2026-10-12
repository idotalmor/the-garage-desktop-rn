export type NoteStatus = 'open' | 'finished' | 'deleted'

export type NoteAttachment = {
  name: string
  type: string
  size: number
  content: string
}

export type NoteRecurrence = 'none' | 'daily' | 'weekly'

export type NoteReminder = {
  id: string
  note_id: string
  remind_at: number
  recurrence: NoteRecurrence
  days: number[]
  fired: number
  created_at: number
}

export type NewNoteReminder = {
  remindAt: number
  days: number[]
}
