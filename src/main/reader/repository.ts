import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import type { MdFile, Tag } from '../../shared/reader/types'

type StoredFile = Omit<MdFile, 'tags'> & { tags: string }

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (db) return db
  const directory = join(app.getPath('home'), '.devflow')
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  db = new Database(join(directory, 'reader.db'))
  db.exec(`
    CREATE TABLE IF NOT EXISTS reader_files (
      path TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );
  `)
  return db
}

function parseTags(value: string): Tag[] {
  try {
    return JSON.parse(value) as Tag[]
  } catch {
    return []
  }
}

function toFile(row: StoredFile): MdFile {
  return { path: row.path, name: row.name, content: row.content, tags: parseTags(row.tags) }
}

export function listReaderFiles(): MdFile[] {
  const rows = getDb()
    .prepare('SELECT path, name, content, tags FROM reader_files ORDER BY updated_at DESC')
    .all() as StoredFile[]
  return rows.map(toFile)
}

export function saveReaderFile(file: MdFile): MdFile {
  getDb()
    .prepare(
      `INSERT INTO reader_files (path, name, content, tags, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(path) DO UPDATE SET
         name = excluded.name,
         content = excluded.content,
         tags = excluded.tags,
         updated_at = excluded.updated_at`
    )
    .run(file.path, file.name, file.content, JSON.stringify(file.tags), Date.now())
  return file
}

export function removeReaderFile(path: string): void {
  getDb().prepare('DELETE FROM reader_files WHERE path = ?').run(path)
}
