import { Bell, BellPlus, CalendarDays, Check, Repeat, X } from 'lucide-react'
import { cloneElement, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button, Calendar, Chip, DatePicker, Popover, ToggleButton } from '@heroui/react'
import { DateInputGroup } from '@heroui/react/date-input-group'
import { CalendarDateTime, getLocalTimeZone } from '@internationalized/date'
import type { NoteReminder } from '../../../../../shared/notes/types'
import { formatReminderTime, recurrenceLabel } from '../utils'

const HOUR_MS = 60 * 60 * 1000
const QUICK_HOURS = [1, 2, 3]
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const circleClass = 'size-6 min-w-0 rounded-full p-0 text-[10px] font-semibold'
const daySelectedClass =
  'data-[selected=true]:border-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[selected=true]:hover:bg-accent'

function toCalendarDateTime(timestamp: number): CalendarDateTime {
  const date = new Date(timestamp)
  return new CalendarDateTime(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  )
}

type ReminderPickerProps = {
  reminders?: NoteReminder[]
  onAdd: (remindAt: number, days: number[], label?: string) => void
  onRemove?: (reminderId: string) => void
  placement?: 'top' | 'bottom'
  label?: React.ReactNode
  trigger?: React.ReactNode
  inline?: boolean
}

export function ReminderPicker({
  reminders = [],
  onAdd,
  onRemove,
  placement = 'top',
  label = 'Remind me',
  trigger,
  inline = false
}: ReminderPickerProps): React.JSX.Element {
  const [pickedAt, setPickedAt] = useState<number | null>(null)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [showDateInput, setShowDateInput] = useState(false)
  const [now, setNow] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleDay = (day: number): void => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    )
  }

  const resetPicker = (): void => {
    setPickedAt(null)
    setSelectedDays([])
    setShowDateInput(false)
    setExpanded(false)
  }

  const addPicked = (): void => {
    if (pickedAt === null || pickedAt <= Date.now()) return
    onAdd(pickedAt, selectedDays)
    resetPicker()
  }

  const toggleInline = (): void => {
    setExpanded((current) => !current)
  }

  useEffect(() => {
    if (!expanded) return
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as HTMLElement
      if (containerRef.current?.contains(target)) return
      if (target.closest('.popover, .date-picker__popover, [role="dialog"]')) return
      setExpanded(false)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  const body = (
    <>
      {reminders.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex items-center justify-between gap-2 text-xs tabular-nums"
            >
              <span
                className={`flex items-center gap-1.5 ${reminder.fired === 1 || reminder.remind_at <= now ? 'text-muted line-through' : ''}`}
              >
                <Bell size={12} className="shrink-0" aria-hidden="true" />
                {formatReminderTime(reminder.remind_at)}
                {reminder.recurrence !== 'none' && (
                  <span className="flex items-center gap-0.5 text-muted no-underline">
                    <Repeat size={10} aria-hidden="true" />
                    {recurrenceLabel(reminder)}
                  </span>
                )}
              </span>
              {onRemove && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="size-5"
                  onPress={() => onRemove(reminder.id)}
                  aria-label={`Remove reminder ${formatReminderTime(reminder.remind_at)}`}
                >
                  <X className="size-3" aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-1.5">
        {QUICK_HOURS.map((hours) => (
          <Button
            key={hours}
            isIconOnly
            size="sm"
            variant="outline"
            className={circleClass}
            onPress={() => {
              onAdd(Date.now() + hours * HOUR_MS, [], `${hours}hr`)
              resetPicker()
            }}
            aria-label={`Remind me in ${hours} hour${hours === 1 ? '' : 's'}`}
          >
            {hours}hr
          </Button>
        ))}
        <Button
          isIconOnly
          size="sm"
          variant={showDateInput ? 'primary' : 'outline'}
          className={circleClass}
          onPress={() => setShowDateInput((current) => !current)}
          aria-label="Pick a date and time"
          aria-pressed={showDateInput}
        >
          <CalendarDays size={12} aria-hidden="true" />
        </Button>
        {showDateInput && (
          <DatePicker
            granularity="minute"
            value={pickedAt === null ? null : toCalendarDateTime(pickedAt)}
            onChange={(value) =>
              setPickedAt(value ? value.toDate(getLocalTimeZone()).getTime() : null)
            }
            aria-label="Reminder date and time"
          >
            <DateInputGroup className="h-7 w-fit">
              <DateInputGroup.Input>
                {(segment) => <DateInputGroup.Segment segment={segment} />}
              </DateInputGroup.Input>
              <DateInputGroup.Suffix>
                <DatePicker.Trigger>
                  <DatePicker.TriggerIndicator />
                </DatePicker.Trigger>
              </DateInputGroup.Suffix>
            </DateInputGroup>
            <DatePicker.Popover>
              <Calendar aria-label="Reminder date">
                <Calendar.Header>
                  <Calendar.NavButton slot="previous" />
                  <Calendar.Heading />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>
              <div className="mt-2 flex justify-center gap-1">
                {WEEKDAYS.map((letter, day) => (
                  <ToggleButton
                    key={day}
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    isSelected={selectedDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    className={`${circleClass} size-5 border border-border ${daySelectedClass}`}
                    aria-label={`Repeat on ${WEEKDAY_NAMES[day]}`}
                  >
                    {letter}
                  </ToggleButton>
                ))}
              </div>
            </DatePicker.Popover>
          </DatePicker>
        )}
        {pickedAt !== null && pickedAt > now && (
          <Button
            isIconOnly
            size="sm"
            variant="primary"
            className={circleClass}
            onPress={addPicked}
            aria-label="Add reminder"
          >
            <Check size={12} aria-hidden="true" />
          </Button>
        )}
      </div>
    </>
  )

  if (inline) {
    const iconBg = expanded ? 'rounded-full bg-surface-secondary' : ''
    const icon = trigger ? (
      cloneElement(
        trigger as React.ReactElement<{
          onPress?: () => void
          className?: string
          'aria-expanded'?: boolean
        }>,
        {
          onPress: toggleInline,
          'aria-expanded': expanded,
          className:
            `${(trigger as React.ReactElement<{ className?: string }>).props.className ?? ''} ${iconBg}`.trim()
        }
      )
    ) : (
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className={`size-6 shrink-0 ${iconBg}`}
        onPress={toggleInline}
        aria-label={expanded ? 'Close reminder picker' : 'Add reminder'}
        aria-expanded={expanded}
      >
        {expanded ? (
          <Bell size={14} aria-hidden="true" />
        ) : (
          <BellPlus size={14} aria-hidden="true" />
        )}
      </Button>
    )

    return (
      <div ref={containerRef} className="relative flex items-center">
        {expanded ? <span className="inline-block size-6" aria-hidden="true" /> : icon}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="picker-body"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{ transformOrigin: 'left center' }}
              className="absolute left-0 top-1/2 z-50 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-neutral-50 py-0.5 pl-0.5 pr-1.5 shadow-overlay shadow-md"
            >
              {icon}
              {body}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <Popover onOpenChange={(isOpen) => isOpen && setNow(Date.now())}>
      <Popover.Trigger>
        {trigger ?? (
          <Chip
            variant="tertiary"
            size="sm"
            className="cursor-pointer gap-1 rounded-md border-2 border-border"
          >
            {reminders.length > 0 ? (
              <Bell size={12} aria-hidden="true" />
            ) : (
              <BellPlus size={12} aria-hidden="true" />
            )}
            <Chip.Label>{label}</Chip.Label>
          </Chip>
        )}
      </Popover.Trigger>
      <Popover.Content placement={placement} offset={6}>
        <Popover.Arrow />
        <Popover.Dialog className="flex w-fit flex-col gap-2 p-3">
          <Popover.Heading className="sr-only">Reminders</Popover.Heading>
          {body}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}
