import { ipcMain, app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

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

export function initNotesIpc(): void {
  const database = getDb()

  ipcMain.handle('notes:list', (_, options?: { done?: boolean }) => {
    const done = options?.done
    let sql = 'SELECT * FROM notes'
    const params: (number | string)[] = []
    if (done !== undefined) {
      sql += ' WHERE done = ?'
      params.push(done ? 1 : 0)
    }
    sql += ' ORDER BY created_at DESC'
    const stmt = database.prepare(sql)
    return params.length ? stmt.all(...params) : stmt.all()
  })

  ipcMain.handle('notes:add', (_, body: string) => {
    const id = randomUUID()
    const createdAt = Date.now()
    const stmt = database.prepare(
      'INSERT INTO notes (id, body, done, created_at) VALUES (?, ?, 0, ?)'
    )
    stmt.run(id, body, createdAt)
    return { id, body, done: 0, createdAt }
  })

  ipcMain.handle('notes:toggle', (_, id: string) => {
    const note = database.prepare('SELECT done FROM notes WHERE id = ?').get(id) as
      { done: number } | undefined
    if (!note) throw new Error('Note not found')
    const done = note.done ? 0 : 1
    database.prepare('UPDATE notes SET done = ? WHERE id = ?').run(done, id)
    return { id, done }
  })

  ipcMain.handle('notes:delete', (_, id: string) => {
    database.prepare('DELETE FROM notes WHERE id = ?').run(id)
    return { id }
  })
}
