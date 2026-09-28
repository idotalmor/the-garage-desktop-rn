import { useEffect, useRef, useState } from 'react'

type EditableTextProps = {
  value: string | null
  placeholder?: string
  onSave: (value: string) => void
  className?: string
  inputClassName?: string
  ariaLabel?: string
}

export function EditableText({
  value,
  placeholder = '',
  onSave,
  className = '',
  inputClassName = '',
  ariaLabel = 'Rename'
}: EditableTextProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const committed = useRef(false)
  const cancelled = useRef(false)
  const isEditingRef = useRef(false)
  const draftRef = useRef('')
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    isEditingRef.current = isEditing
    draftRef.current = draft
    onSaveRef.current = onSave
  })

  useEffect(
    () => () => {
      if (isEditingRef.current && !committed.current && !cancelled.current) {
        onSaveRef.current(draftRef.current)
      }
    },
    []
  )

  if (!isEditing) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          committed.current = false
          cancelled.current = false
          setDraft(value ?? '')
          setIsEditing(true)
        }}
        aria-label={ariaLabel}
      >
        {value || placeholder}
      </button>
    )
  }

  const commit = (): void => {
    committed.current = true
    onSave(draft)
    setIsEditing(false)
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      className={inputClassName}
      onBlur={() => {
        if (cancelled.current) {
          cancelled.current = false
          setIsEditing(false)
          return
        }
        commit()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') {
          cancelled.current = true
          event.currentTarget.blur()
        }
      }}
    />
  )
}
