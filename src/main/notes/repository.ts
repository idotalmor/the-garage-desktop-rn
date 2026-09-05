import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import type { NoteAttachment, NoteStatus } from '../../shared/notes/types'

export type NoteRow = {
  id: string
  body: string
  done: number
  deleted: number
  created_at: number
  attachments: NoteAttachment[]
}

type StoredNoteRow = Omit<NoteRow, 'attachments'> & { attachments: string | null }

let db: Database.Database | null = null

function parseAttachments(value: string | null): NoteAttachment[] {
  if (!value) return []
  try {
    return JSON.parse(value) as NoteAttachment[]
  } catch {
    return []
  }
}

function toNoteRow(row: StoredNoteRow): NoteRow {
  return { ...row, attachments: parseAttachments(row.attachments) }
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
  `)

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
  return rows.map(toNoteRow)
}

export function addNote(body: string, attachments: NoteAttachment[] = []): NoteRow {
  const id = randomUUID()
  const createdAt = Date.now()
  const stmt = getDb().prepare(
    'INSERT INTO notes (id, body, done, deleted, attachments, created_at) VALUES (?, ?, 0, 0, ?, ?)'
  )
  stmt.run(id, body, JSON.stringify(attachments), createdAt)
  return { id, body, done: 0, deleted: 0, attachments, created_at: createdAt }
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
