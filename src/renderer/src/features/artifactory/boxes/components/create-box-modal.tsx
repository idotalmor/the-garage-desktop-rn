import { Package, X } from 'lucide-react'
import { useState } from 'react'
import { parseColor, type Color } from 'react-aria-components'
import { Button } from '@heroui/react'
import { ColorArea } from '@heroui/react/color-area'
import { ColorPicker } from '@heroui/react/color-picker'
import { ColorSlider } from '@heroui/react/color-slider'
import { ColorSwatch } from '@heroui/react/color-swatch'
import { Label } from '@heroui/react/label'
import { Modal } from '@heroui/react/modal'

type CreateBoxModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (input: { name: string; color: string; ticketKey?: string }) => void
}

function randomColor(): Color {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 60 + Math.floor(Math.random() * 20)
  const lightness = 50 + Math.floor(Math.random() * 10)
  try {
    return parseColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
  } catch {
    return parseColor('#8b5cf6')
  }
}

export function CreateBoxModal({
  isOpen,
  onClose,
  onConfirm
}: CreateBoxModalProps): React.JSX.Element | null {
  const [name, setName] = useState('')
  const [ticketKey, setTicketKey] = useState('')
  const [color, setColor] = useState<Color>(randomColor())

  const handleOpenChange = (open: boolean): void => {
    if (!open) onClose()
  }

  const submit = (): void => {
    if (!name.trim()) return
    onConfirm({ name, color: color.toString('hex'), ticketKey })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="relative w-full max-w-md p-0">
            <Modal.CloseTrigger
              className="absolute right-3 top-3 rounded-full p-1 text-muted hover:text-foreground"
              aria-label="Close"
            >
              <X size={16} aria-hidden="true" />
            </Modal.CloseTrigger>

            <Modal.Header className="border-b border-separator px-4 py-3">
              <Modal.Icon className="bg-surface-secondary text-accent">
                <Package size={18} aria-hidden="true" />
              </Modal.Icon>
              <Modal.Heading>New box</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-4 p-4">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                  Box name
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && submit()}
                  placeholder="e.g. Auth rework"
                  autoFocus
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted"
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                  Ticket key <span className="normal-case text-muted/70">(optional)</span>
                </p>
                <input
                  type="text"
                  value={ticketKey}
                  onChange={(event) => setTicketKey(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && submit()}
                  placeholder="e.g. DEV-1234"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted"
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                  Color
                </p>
                <ColorPicker value={color} onChange={setColor}>
                  <ColorPicker.Trigger className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
                    <ColorSwatch size="sm" />
                    <Label className="text-[11px] text-muted">Pick a color</Label>
                  </ColorPicker.Trigger>
                  <ColorPicker.Popover className="w-52 gap-2 p-3">
                    <ColorArea
                      colorSpace="hsb"
                      xChannel="saturation"
                      yChannel="brightness"
                      className="h-24 w-full rounded-lg"
                    >
                      <ColorArea.Thumb />
                    </ColorArea>
                    <ColorSlider colorSpace="hsb" channel="hue" className="w-full">
                      <ColorSlider.Track className="h-3 rounded-full">
                        <ColorSlider.Thumb />
                      </ColorSlider.Track>
                    </ColorSlider>
                  </ColorPicker.Popover>
                </ColorPicker>
              </div>
            </Modal.Body>

            <Modal.Footer className="border-t border-separator px-4 py-3">
              <Button size="sm" variant="ghost" className="rounded-lg text-xs" onPress={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="rounded-lg text-xs"
                onPress={submit}
                isDisabled={!name.trim()}
              >
                Create box
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
