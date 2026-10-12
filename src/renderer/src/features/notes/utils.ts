import type { NoteReminder } from '../../../../shared/notes/types'

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function daysLabel(days: number[]): string {
  if (days.length === 0) return ''
  if (days.length === 7) return 'daily'
  return [...days]
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_LETTERS[day])
    .join('')
}

export function recurrenceLabel(reminder: Pick<NoteReminder, 'recurrence' | 'days'>): string {
  if (reminder.recurrence === 'daily') return 'daily'
  if (reminder.recurrence === 'weekly') return daysLabel(reminder.days) || 'weekly'
  return ''
}

export function nextReminderLabel(reminders: NoteReminder[]): string {
  const next = reminders.find((reminder) => reminder.fired === 0)
  return next ? formatReminderTime(next.remind_at) : 'Remind me'
}

export function formatReminderTime(timestamp: number): string {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' as const } : {}),
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}
