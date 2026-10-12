import { X } from 'lucide-react'
import { Modal as HeroModal } from '@heroui/react'

export function Modal({
  title,
  children,
  onClose
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}): React.JSX.Element {
  return (
    <HeroModal isOpen onOpenChange={(isOpen) => !isOpen && onClose()}>
      <HeroModal.Backdrop>
        <HeroModal.Container>
          <HeroModal.Dialog className="relative w-full max-w-lg p-0">
            <HeroModal.CloseTrigger
              className="absolute right-3 top-3 rounded-full p-1 text-muted hover:text-foreground"
              aria-label="Close"
            >
              <X size={16} aria-hidden="true" />
            </HeroModal.CloseTrigger>
            <HeroModal.Header className="border-b border-separator px-4 py-3">
              <HeroModal.Heading>{title}</HeroModal.Heading>
            </HeroModal.Header>
            <HeroModal.Body className="p-4">{children}</HeroModal.Body>
          </HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal>
  )
}
