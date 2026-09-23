import { Hourglass } from 'lucide-react'
import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

const FOCUS_SECONDS = 60 * 60

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function FocusControl(): React.JSX.Element {
  const [remaining, setRemaining] = useState<number | null>(null)
  const isActive = remaining !== null

  useEffect(() => {
    if (!isActive) return
    const timer = window.setInterval(() => {
      setRemaining((current) => (current !== null && current > 0 ? current - 1 : null))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isActive])

  const start = (): void => setRemaining(FOCUS_SECONDS)

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {!isActive ? (
        <motion.div
          key="start"
          layoutId="focus-control"
          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        >
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-7! rounded-full"
            onPress={start}
            aria-label="Start focus mode"
          >
            <Hourglass className="size-4!" aria-hidden="true" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="chip"
          layoutId="focus-control"
          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        >
          <div
            role="button"
            tabIndex={0}
            aria-label="Focus session in progress, press to restart"
            className="flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-success px-2.5 text-white"
            onClick={start}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') start()
            }}
          >
            <Hourglass className="size-3!" aria-hidden="true" />
            <span className="text-xs font-medium tabular-nums">
              {formatRemaining(remaining ?? 0)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
