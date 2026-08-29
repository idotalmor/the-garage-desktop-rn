import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export type NoteRow = {
  id: string
  body: string
  done: number
  created_at: number
}

let db: Database.Database | null = null

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
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notes_done ON notes(done);
  `)

  app.on('before-quit', () => {
    console.log('[notes] closing database')
    db?.close()
  })

  return db
}

export function listNotes(options?: { done?: boolean }): NoteRow[] {
  const done = options?.done
  let sql = 'SELECT * FROM notes'
  const params: (number | string)[] = []
  if (done !== undefined) {
    sql += ' WHERE done = ?'
    params.push(done ? 1 : 0)
  }
  sql += ' ORDER BY created_at DESC'
  const stmt = getDb().prepare(sql)
  return (params.length ? stmt.all(...params) : stmt.all()) as NoteRow[]
}

export function addNote(body: string): NoteRow {
  const id = randomUUID()
  const createdAt = Date.now()
  const stmt = getDb().prepare('INSERT INTO notes (id, body, done, created_at) VALUES (?, ?, 0, ?)')
  stmt.run(id, body, createdAt)
  return { id, body, done: 0, created_at: createdAt }
}

export function toggleNote(id: string): { id: string; done: number } {
  const note = getDb().prepare('SELECT done FROM notes WHERE id = ?').get(id) as
    { done: number } | undefined
  if (!note) throw new Error('Note not found')
  const done = note.done ? 0 : 1
  getDb().prepare('UPDATE notes SET done = ? WHERE id = ?').run(done, id)
  return { id, done }
}

export function deleteNote(id: string): { id: string } {
  getDb().prepare('DELETE FROM notes WHERE id = ?').run(id)
  return { id }
}
