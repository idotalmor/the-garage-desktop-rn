import { Check, CircleX, Clock3 } from 'lucide-react'
import type { CiStatus } from './types'

export function CiBadge({ status }: { status: CiStatus }): React.JSX.Element {
  const labels = { passing: 'Passing', 'in-progress': 'In progress', failing: 'Failing' }
  const icons = {
    passing: <Check size={12} />,
    'in-progress': <Clock3 size={12} />,
    failing: <CircleX size={12} />
  }
  const styles = {
    passing: 'bg-success/15 text-success',
    'in-progress': 'bg-warning/15 text-warning',
    failing: 'bg-danger/15 text-danger'
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${styles[status]}`}
    >
      {icons[status]}
      {labels[status]}
    </span>
  )
}
