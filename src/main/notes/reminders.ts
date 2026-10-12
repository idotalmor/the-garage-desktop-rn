import { Notification } from 'electron'
import type { NoteReminder } from '../../shared/notes/types'
import { advanceReminder, listDueReminders, markReminderFired } from './repository'
import { focusMainOrCreate } from '../popover'

const SWEEP_INTERVAL_MS = 15_000
const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

let sweep: ReturnType<typeof setInterval> | null = null

function nextOccurrence(reminder: NoteReminder, now: number): number {
  if (reminder.recurrence === 'daily') {
    return reminder.remind_at + DAY_MS
  }
  if (reminder.recurrence === 'weekly' && reminder.days.length === 0) {
    return reminder.remind_at + WEEK_MS
  }
  for (let i = 1; i <= 7; i += 1) {
    const next = reminder.remind_at + i * DAY_MS
    if (reminder.days.includes(new Date(next).getDay()) && next > now) return next
  }
  return reminder.remind_at + WEEK_MS
}

function fireDueReminders(): void {
  const now = Date.now()
  for (const reminder of listDueReminders(now)) {
    if (reminder.recurrence === 'none') {
      markReminderFired(reminder.id)
    } else {
      advanceReminder(reminder.id, nextOccurrence(reminder, now))
    }
    if (!Notification.isSupported()) continue
    const notification = new Notification({
      title: 'Note reminder',
      body: reminder.body || 'You have a note to address.'
    })
    notification.on('click', () => focusMainOrCreate())
    notification.show()
  }
}

export function startReminderScheduler(): void {
  if (sweep) return
  fireDueReminders()
  sweep = setInterval(fireDueReminders, SWEEP_INTERVAL_MS)
}
