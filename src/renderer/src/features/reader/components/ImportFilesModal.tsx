import { FileText, Plus, Tag as TagIcon, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { parseColor, type Color } from 'react-aria-components'
import { Button } from '@heroui/react'
import { ColorArea } from '@heroui/react/color-area'
import { ColorPicker } from '@heroui/react/color-picker'
import { ColorSlider } from '@heroui/react/color-slider'
import { ColorSwatch } from '@heroui/react/color-swatch'
import { Label } from '@heroui/react/label'
import { Modal } from '@heroui/react/modal'
import type { ImportMode, Tag } from '../../../../../shared/reader/types'

type ImportFilesModalProps = {
  isOpen: boolean
  onClose: () => void
  paths: string[]
  existingTags: Tag[]
  onConfirm: (mode: ImportMode, tag?: Tag) => void
}

const modeOptions: { id: ImportMode; label: string }[] = [
  { id: 'copy', label: 'Copy' },
  { id: 'copy-and-delete', label: 'Copy & delete' },
  { id: 'reference', label: 'Use original' }
]

function fileName(path: string): string {
  return path.split('/').pop() || path
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

function TagButton({
  tag,
  selected,
  onPress
}: {
  tag: Tag
  selected: boolean
  onPress: () => void
}): React.JSX.Element {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1 rounded-full border px-2.5 text-[11px]"
      style={{
        borderColor: tag.color,
        backgroundColor: selected ? tag.color : undefined,
        color: selected ? '#ffffff' : tag.color
      }}
      onPress={onPress}
    >
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: selected ? '#ffffff' : tag.color }}
        aria-hidden="true"
      />
      {tag.name}
    </Button>
  )
}

export function ImportFilesModal({
  isOpen,
  onClose,
  paths,
  existingTags,
  onConfirm
}: ImportFilesModalProps): React.JSX.Element | null {
  const [mode, setMode] = useState<ImportMode>('copy')
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState<Color>(randomColor())

  const selectedTagColor = useMemo(
    () => (selectedTag ? selectedTag.color : newTagColor.toString('hex')),
    [selectedTag, newTagColor]
  )

  const handleOpenChange = (open: boolean): void => {
    if (!open) onClose()
  }

  const addNewTag = (): void => {
    const trimmed = newTagName.trim()
    if (!trimmed) return
    const existing = existingTags.find((tag) => tag.name === trimmed)
    const tag: Tag = existing ?? { name: trimmed, color: newTagColor.toString('hex') }
    setSelectedTag(tag)
    setNewTagName('')
    setIsCreating(false)
  }

  const submit = (): void => {
    onConfirm(mode, selectedTag ?? undefined)
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
                <TagIcon size={18} aria-hidden="true" />
              </Modal.Icon>
              <Modal.Heading>Import files</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-4 p-4">
              <div>
                <p className="mb-2 text-[11px] font-medium text-muted uppercase tracking-wide">
                  Dropped files
                </p>
                <ul className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-border p-2 text-xs">
                  {paths.map((path) => (
                    <li key={path} className="flex items-center gap-1.5 text-muted">
                      <FileText size={12} aria-hidden="true" />
                      <span className="truncate">{fileName(path)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium text-muted uppercase tracking-wide">
                  Import action
                </p>
                <div className="flex gap-1">
                  {modeOptions.map(({ id, label }) => (
                    <Button
                      key={id}
                      size="sm"
                      fullWidth
                      variant={mode === id ? 'secondary' : 'ghost'}
                      className="rounded-md text-[11px]"
                      onPress={() => setMode(id)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium text-muted uppercase tracking-wide">
                  Tag
                </p>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className={`size-7 rounded-full ${isCreating ? 'bg-surface-secondary' : ''}`}
                    onPress={() => {
                      setIsCreating((current) => !current)
                      setNewTagColor(randomColor())
                    }}
                    aria-label="Create new tag"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-full border border-dashed border-muted px-2.5 text-[11px]"
                    style={{
                      backgroundColor: selectedTag === null ? 'var(--accent)' : undefined,
                      color: selectedTag === null ? '#ffffff' : undefined,
                      borderColor: selectedTag === null ? 'var(--accent)' : undefined
                    }}
                    onPress={() => setSelectedTag(null)}
                  >
                    No tag
                  </Button>

                  {existingTags.map((tag) => (
                    <TagButton
                      key={tag.name}
                      tag={tag}
                      selected={selectedTag?.name === tag.name}
                      onPress={() => setSelectedTag(tag)}
                    />
                  ))}
                </div>

                <AnimatePresence initial={false}>
                  {isCreating && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 rounded-xl border border-border bg-surface-secondary p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newTagName}
                            onChange={(event) => setNewTagName(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && addNewTag()}
                            placeholder="New tag name..."
                            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted"
                          />
                          <ColorPicker value={newTagColor} onChange={setNewTagColor}>
                            <ColorPicker.Trigger className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
                              <ColorSwatch size="sm" />
                              <Label className="text-[11px] text-muted">Color</Label>
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

                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-muted">
                            Selected color:{' '}
                            <span
                              className="inline-block size-3 rounded-full align-middle"
                              style={{ backgroundColor: selectedTagColor }}
                            />{' '}
                            <span className="font-mono text-foreground">{selectedTagColor}</span>
                          </p>
                          <Button
                            size="sm"
                            variant="primary"
                            className="rounded-lg text-xs"
                            onPress={addNewTag}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedTag && (
                  <p className="mt-2 text-[11px] text-muted">
                    Selected tag:{' '}
                    <span className="font-medium text-foreground">{selectedTag.name}</span>
                  </p>
                )}
              </div>
            </Modal.Body>

            <Modal.Footer className="border-t border-separator px-4 py-3">
              <Button size="sm" variant="ghost" className="rounded-lg text-xs" onPress={onClose}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" className="rounded-lg text-xs" onPress={submit}>
                Import
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
