import { Check, Play, X } from 'lucide-react'
import { Button } from '@heroui/react'
import { createPortal } from 'react-dom'
import { FOCUS_FINISH_SOUNDS, type FocusFinishSound } from '../../../../../shared/focus-mode/types'
import { FINISH_SOUND_LABELS, playFinishSound } from '../utils'

type FocusSettingsModalProps = {
  finishSound: FocusFinishSound
  onSelect: (sound: FocusFinishSound) => void
  onClose: () => void
}

export function FocusSettingsModal({
  finishSound,
  onSelect,
  onClose
}: FocusSettingsModalProps): React.JSX.Element {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Focus mode settings"
      onClick={onClose}
    >
      <div
        className="w-72 rounded-2xl border border-border bg-overlay p-4 shadow-overlay"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Focus settings</h2>
            <p className="mt-0.5 text-xs text-muted">Sound when a timer finishes</p>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-7 rounded-full text-muted hover:text-foreground"
            onPress={onClose}
            aria-label="Close settings"
          >
            <X size={14} aria-hidden="true" />
          </Button>
        </div>
        <ul className="mt-3 space-y-1" role="radiogroup" aria-label="Finish sound">
          {FOCUS_FINISH_SOUNDS.map((sound) => {
            const isSelected = sound === finishSound
            return (
              <li key={sound}>
                <div
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 ${
                    isSelected ? 'bg-surface-secondary' : 'hover:bg-surface-secondary'
                  }`}
                  onClick={() => onSelect(sound)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(sound)
                    }
                  }}
                >
                  <span className="flex-1 text-xs font-medium text-foreground">
                    {FINISH_SOUND_LABELS[sound]}
                  </span>
                  {sound !== 'none' && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      className="size-6! rounded-full text-muted hover:text-foreground"
                      onPress={() => playFinishSound(sound)}
                      aria-label={`Preview ${FINISH_SOUND_LABELS[sound]}`}
                    >
                      <Play size={11} aria-hidden="true" />
                    </Button>
                  )}
                  {isSelected && <Check size={14} className="text-success" aria-hidden="true" />}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>,
    document.body
  )
}
