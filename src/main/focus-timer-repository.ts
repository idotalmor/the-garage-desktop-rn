import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import type { FocusTimerHistoryEntry } from '../shared/focus-mode/types'

type StoredTimerRow = {
  id: string
  group_id: string | null
  name: string | null
  duration_ms: number
  run_count: number
  started_at: number
  ended_at: number | null
  total_elapsed_ms: number
  state: string
}

let db: Database.Database | null = null

function toHistoryEntry(row: StoredTimerRow): FocusTimerHistoryEntry {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    durationMs: row.duration_ms,
    runCount: row.run_count,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    totalElapsedMs: row.total_elapsed_ms,
    state: row.state as FocusTimerHistoryEntry['state']
  }
}

function getDb(): Database.Database {
  if (db) return db

  const dbDir = join(app.getPath('home'), '.devflow')
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = join(dbDir, 'focus-timers.db')
  console.log('[focus-mode] opening database at', dbPath)

  db = new Database(dbPath)
  db.pragma('journal_mode = DELETE')
  db.exec(`
    CREATE TABLE IF NOT EXISTS focus_timers (
      id TEXT PRIMARY KEY,
      name TEXT,
      duration_ms INTEGER NOT NULL,
      run_count INTEGER NOT NULL DEFAULT 1,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      total_elapsed_ms INTEGER NOT NULL DEFAULT 0,
      state TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_focus_timers_started_at ON focus_timers(started_at);
  `)

  const columns = db.prepare('PRAGMA table_info(focus_timers)').all() as { name: string }[]
  if (!columns.some((column) => column.name === 'group_id')) {
    db.exec('ALTER TABLE focus_timers ADD COLUMN group_id TEXT')
  }

  app.on('before-quit', () => {
    console.log('[focus-mode] closing database')
    db?.close()
  })

  return db
}

export function insertTimerRecord(timer: {
  id: string
  groupId: string | null
  name: string | null
  durationMs: number
  startedAt: number
}): void {
  getDb()
    .prepare(
      `INSERT INTO focus_timers (id, group_id, name, duration_ms, run_count, started_at, ended_at, total_elapsed_ms, state)
       VALUES (?, ?, ?, ?, 1, ?, NULL, 0, 'running')`
    )
    .run(timer.id, timer.groupId, timer.name, timer.durationMs, timer.startedAt)
}

export function insertScheduledRecord(timer: {
  id: string
  groupId: string | null
  name: string | null
  durationMs: number
  startsAt: number
}): void {
  getDb()
    .prepare(
      `INSERT INTO focus_timers (id, group_id, name, duration_ms, run_count, started_at, ended_at, total_elapsed_ms, state)
       VALUES (?, ?, ?, ?, 0, ?, NULL, 0, 'scheduled')`
    )
    .run(timer.id, timer.groupId, timer.name, timer.durationMs, timer.startsAt)
}

export function beginRun(timerId: string, durationMs: number, startedAt: number): void {
  getDb()
    .prepare(
      `UPDATE focus_timers
       SET run_count = run_count + 1, duration_ms = ?, started_at = ?, ended_at = NULL, state = 'running'
       WHERE id = ?`
    )
    .run(durationMs, startedAt, timerId)
}

export function endRun(
  timerId: string,
  outcome: 'finished' | 'stopped',
  endedAt: number,
  elapsedMs: number
): void {
  getDb()
    .prepare(
      `UPDATE focus_timers
       SET state = ?, ended_at = ?, total_elapsed_ms = total_elapsed_ms + ?
       WHERE id = ? AND state IN ('running', 'scheduled')`
    )
    .run(outcome, endedAt, Math.max(0, elapsedMs), timerId)
}

export function renameTimerRecord(timerId: string, name: string | null): void {
  getDb().prepare('UPDATE focus_timers SET name = ? WHERE id = ?').run(name, timerId)
}

export function markInterruptedRuns(): void {
  const now = Date.now()
  getDb()
    .prepare(
      `UPDATE focus_timers
       SET state = 'interrupted', ended_at = ?
       WHERE state = 'running'`
    )
    .run(now)
  getDb()
    .prepare(
      `UPDATE focus_timers
       SET state = 'interrupted', ended_at = ?
       WHERE state = 'scheduled' AND started_at <= ?`
    )
    .run(now, now)
}

export function listScheduledTimers(): FocusTimerHistoryEntry[] {
  const rows = getDb()
    .prepare(`SELECT * FROM focus_timers WHERE state = 'scheduled'`)
    .all() as StoredTimerRow[]
  return rows.map(toHistoryEntry)
}

export function listTimerHistory(): FocusTimerHistoryEntry[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM focus_timers
       WHERE state NOT IN ('running', 'scheduled')
       ORDER BY started_at DESC`
    )
    .all() as StoredTimerRow[]
  return rows.map(toHistoryEntry)
}
