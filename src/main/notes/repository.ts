import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import type {
  NewNoteReminder,
  NoteAttachment,
  NoteRecurrence,
  NoteReminder,
  NoteStatus
} from '../../shared/notes/types'

export type NoteRow = {
  id: string
  body: string
  done: number
  deleted: number
  created_at: number
  attachments: NoteAttachment[]
  reminders: NoteReminder[]
}

type StoredNoteRow = Omit<NoteRow, 'attachments' | 'reminders'> & { attachments: string | null }
type StoredReminderRow = Omit<NoteReminder, 'days'> & { days: string | null }

let db: Database.Database | null = null

function parseAttachments(value: string | null): NoteAttachment[] {
  if (!value) return []
  try {
    return JSON.parse(value) as NoteAttachment[]
  } catch {
    return []
  }
}

function parseDays(value: string | null): number[] {
  if (!value) return []
  try {
    return JSON.parse(value) as number[]
  } catch {
    return []
  }
}

function toReminder(row: StoredReminderRow): NoteReminder {
  return { ...row, days: parseDays(row.days) }
}

function toNoteRow(row: StoredNoteRow, reminders: NoteReminder[] = []): NoteRow {
  return { ...row, attachments: parseAttachments(row.attachments), reminders }
}

function getDb(): Database.Database {
  if (db) return db

  const dbDir = join(app.getPath('home'), '.devflow')
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = join(dbDir, 'notes.db')
  console.log('[notes] opening database at', dbPath)

  db = new Database(dbPath)
  db.pragma('journal_mode = DELETE')
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      body TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      deleted INTEGER NOT NULL DEFAULT 0,
      attachments TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notes_done ON notes(done);
    CREATE TABLE IF NOT EXISTS note_reminders (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      remind_at INTEGER NOT NULL,
      recurrence TEXT NOT NULL DEFAULT 'none',
      days TEXT NOT NULL DEFAULT '[]',
      fired INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_note_reminders_note ON note_reminders(note_id);
    CREATE INDEX IF NOT EXISTS idx_note_reminders_due ON note_reminders(fired, remind_at);
  `)

  const reminderColumns = db.prepare('PRAGMA table_info(note_reminders)').all() as {
    name: string
  }[]
  if (!reminderColumns.some((column) => column.name === 'recurrence')) {
    db.exec("ALTER TABLE note_reminders ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'none'")
  }
  if (!reminderColumns.some((column) => column.name === 'days')) {
    db.exec("ALTER TABLE note_reminders ADD COLUMN days TEXT NOT NULL DEFAULT '[]'")
  }

  const columns = db.prepare('PRAGMA table_info(notes)').all() as { name: string }[]
  if (!columns.some((column) => column.name === 'deleted')) {
    db.exec('ALTER TABLE notes ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0')
  }
  if (!columns.some((column) => column.name === 'attachments')) {
    db.exec("ALTER TABLE notes ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'")
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(deleted)')

  app.on('before-quit', () => {
    console.log('[notes] closing database')
    db?.close()
  })

  return db
}

export function listNotes(options?: { status?: NoteStatus }): NoteRow[] {
  const status = options?.status
  let sql = 'SELECT * FROM notes'
  if (status === 'open') {
    sql += ' WHERE deleted = 0 AND done = 0'
  } else if (status === 'finished') {
    sql += ' WHERE deleted = 0 AND done = 1'
  } else if (status === 'deleted') {
    sql += ' WHERE deleted = 1'
  }

  sql += ' ORDER BY created_at DESC'
  const rows = getDb().prepare(sql).all() as StoredNoteRow[]

  const reminderRows = (
    getDb()
      .prepare('SELECT * FROM note_reminders ORDER BY remind_at ASC')
      .all() as StoredReminderRow[]
  ).map(toReminder)
  const remindersByNote = new Map<string, NoteReminder[]>()
  for (const reminder of reminderRows) {
    const list = remindersByNote.get(reminder.note_id) ?? []
    list.push(reminder)
    remindersByNote.set(reminder.note_id, list)
  }

  return rows.map((row) => toNoteRow(row, remindersByNote.get(row.id) ?? []))
}

function recurrenceForDays(days: number[]): NoteRecurrence {
  if (days.length === 0) return 'none'
  if (days.length === 7) return 'daily'
  return 'weekly'
}

function insertReminder(noteId: string, remindAt: number, days: number[] = []): NoteReminder {
  const reminder: NoteReminder = {
    id: randomUUID(),
    note_id: noteId,
    remind_at: remindAt,
    recurrence: recurrenceForDays(days),
    days,
    fired: 0,
    created_at: Date.now()
  }
  getDb()
    .prepare(
      'INSERT INTO note_reminders (id, note_id, remind_at, recurrence, days, fired, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)'
    )
    .run(
      reminder.id,
      noteId,
      remindAt,
      reminder.recurrence,
      JSON.stringify(days),
      reminder.created_at
    )
  return reminder
}

export function addNote(
  body: string,
  attachments: NoteAttachment[] = [],
  reminders: NewNoteReminder[] = []
): NoteRow {
  const id = randomUUID()
  const createdAt = Date.now()
  const stmt = getDb().prepare(
    'INSERT INTO notes (id, body, done, deleted, attachments, created_at) VALUES (?, ?, 0, 0, ?, ?)'
  )
  stmt.run(id, body, JSON.stringify(attachments), createdAt)
  const reminderRows = reminders.map((reminder) =>
    insertReminder(id, reminder.remindAt, reminder.days)
  )
  return {
    id,
    body,
    done: 0,
    deleted: 0,
    attachments,
    reminders: reminderRows,
    created_at: createdAt
  }
}

export function addReminder(noteId: string, remindAt: number, days: number[] = []): NoteReminder {
  const note = getDb().prepare('SELECT id FROM notes WHERE id = ?').get(noteId) as
    { id: string } | undefined
  if (!note) throw new Error('Note not found')
  return insertReminder(noteId, remindAt, days)
}

export function removeReminder(id: string): { id: string; note_id: string } {
  const reminder = getDb().prepare('SELECT note_id FROM note_reminders WHERE id = ?').get(id) as
    { note_id: string } | undefined
  if (!reminder) throw new Error('Reminder not found')
  getDb().prepare('DELETE FROM note_reminders WHERE id = ?').run(id)
  return { id, note_id: reminder.note_id }
}

export function listDueReminders(now: number): (NoteReminder & { body: string })[] {
  const rows = getDb()
    .prepare(
      `SELECT r.*, n.body FROM note_reminders r
       JOIN notes n ON n.id = r.note_id
       WHERE r.fired = 0 AND r.remind_at <= ? AND n.deleted = 0
       ORDER BY r.remind_at ASC`
    )
    .all(now) as (StoredReminderRow & { body: string })[]
  return rows.map((row) => ({ ...toReminder(row), body: row.body }))
}

export function markReminderFired(id: string): void {
  getDb().prepare('UPDATE note_reminders SET fired = 1 WHERE id = ?').run(id)
}

export function advanceReminder(id: string, nextRemindAt: number): void {
  getDb().prepare('UPDATE note_reminders SET remind_at = ? WHERE id = ?').run(nextRemindAt, id)
}

export function toggleNote(id: string): { id: string; done: number } {
  const note = getDb().prepare('SELECT done, deleted FROM notes WHERE id = ?').get(id) as
    { done: number; deleted: number } | undefined
  if (!note || note.deleted) throw new Error('Note not found')
  const done = note.done ? 0 : 1
  getDb().prepare('UPDATE notes SET done = ? WHERE id = ?').run(done, id)
  return { id, done }
}

export function deleteNote(id: string): { id: string } {
  const result = getDb().prepare('UPDATE notes SET deleted = 1 WHERE id = ?').run(id)
  if (result.changes === 0) throw new Error('Note not found')
  return { id }
}

export function restoreNote(id: string): { id: string } {
  const result = getDb().prepare('UPDATE notes SET deleted = 0 WHERE id = ?').run(id)
  if (result.changes === 0) throw new Error('Note not found')
  return { id }
}
