export type NoteStatus = 'open' | 'finished' | 'deleted'

export type NoteAttachment = {
  name: string
  type: string
  size: number
  content: string
}
