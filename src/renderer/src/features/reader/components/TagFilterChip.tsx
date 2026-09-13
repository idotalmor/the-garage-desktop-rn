import { Button } from '@heroui/react'

export function TagFilterChip({
  label,
  color,
  selected,
  onPress
}: {
  label: string
  color?: string
  selected: boolean
  onPress: () => void
}): React.JSX.Element {
  const inactive = !selected
    ? color
      ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
      : 'opacity-60 hover:opacity-100'
    : ''

  return (
    <Button
      size="sm"
      variant="ghost"
      className={`h-7 gap-1 rounded-full border px-2.5 text-[11px] transition-all ${inactive}`}
      style={
        color
          ? {
              borderColor: color,
              backgroundColor: selected ? color : undefined,
              color: selected ? '#ffffff' : color
            }
          : {
              backgroundColor: selected ? 'var(--accent)' : undefined,
              color: selected ? '#ffffff' : undefined
            }
      }
      onPress={onPress}
    >
      {color && (
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: selected ? '#ffffff' : color }}
          aria-hidden="true"
        />
      )}
      {label}
    </Button>
  )
}
