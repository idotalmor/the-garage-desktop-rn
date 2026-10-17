import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import type { ArtifactoryBox, MdFile, Tag } from '../../shared/artifactory/types'

type StoredFile = Omit<MdFile, 'tags'> & { tags: string }

type StoredBox = {
  name: string
  color: string
  ticket_key: string | null
  created_at: number
}

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (db) return db
  const directory = join(app.getPath('home'), '.devflow')
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  db = new Database(join(directory, 'artifactory.db'))
  db.exec(`
    CREATE TABLE IF NOT EXISTS artifactory_files (
      path TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS artifactory_boxes (
      name TEXT PRIMARY KEY,
      color TEXT NOT NULL,
      ticket_key TEXT,
      created_at INTEGER NOT NULL
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

export function listArtifactoryFiles(): MdFile[] {
  const rows = getDb()
    .prepare('SELECT path, name, content, tags FROM artifactory_files ORDER BY updated_at DESC')
    .all() as StoredFile[]
  return rows.map(toFile)
}

export function saveArtifactoryFile(file: MdFile): MdFile {
  getDb()
    .prepare(
      `INSERT INTO artifactory_files (path, name, content, tags, updated_at)
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

export function removeArtifactoryFile(path: string): void {
  getDb().prepare('DELETE FROM artifactory_files WHERE path = ?').run(path)
}

export function updateArtifactoryFileTags(path: string, tags: Tag[]): void {
  getDb()
    .prepare('UPDATE artifactory_files SET tags = ?, updated_at = ? WHERE path = ?')
    .run(JSON.stringify(tags), Date.now(), path)
}

function toBox(row: StoredBox): ArtifactoryBox {
  return {
    name: row.name,
    color: row.color,
    ticketKey: row.ticket_key ?? undefined,
    createdAt: row.created_at
  }
}

export function listArtifactoryBoxes(): ArtifactoryBox[] {
  const rows = getDb()
    .prepare(
      'SELECT name, color, ticket_key, created_at FROM artifactory_boxes ORDER BY created_at ASC'
    )
    .all() as StoredBox[]
  return rows.map(toBox)
}

export function saveArtifactoryBox(box: ArtifactoryBox): ArtifactoryBox {
  getDb()
    .prepare(
      `INSERT INTO artifactory_boxes (name, color, ticket_key, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET
         color = excluded.color,
         ticket_key = excluded.ticket_key`
    )
    .run(box.name, box.color, box.ticketKey ?? null, box.createdAt)
  return box
}

export function removeArtifactoryBox(name: string): void {
  const database = getDb()
  database.prepare('DELETE FROM artifactory_boxes WHERE name = ?').run(name)
  for (const file of listArtifactoryFiles()) {
    if (!file.tags.some((tag) => tag.name === name)) continue
    updateArtifactoryFileTags(
      file.path,
      file.tags.filter((tag) => tag.name !== name)
    )
  }
}
