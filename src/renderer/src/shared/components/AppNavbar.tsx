import {
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Sun
} from 'lucide-react'
import { Avatar, Button } from '@heroui/react'
import { AnimatePresence, motion } from 'motion/react'
import { navItems, type AppView } from './appNavigation'
import { useFeatureMenuContribution } from './feature-menu-context'

type AppNavbarProps = {
  view: AppView
  themeLabel: string
  onViewChange: (view: AppView) => void
  onThemeChange: () => void
  position?: 'left' | 'right'
}

export function NavButton({
  id,
  label,
  icon: Icon,
  view,
  onViewChange
}: {
  id: AppView
  label: string
  icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  view: AppView
  onViewChange: (view: AppView) => void
}): React.JSX.Element {
  const isCurrent = view === id
  return (
    <span title={label} className="inline-flex">
      <Button
        isIconOnly
        size="sm"
        variant={isCurrent ? 'secondary' : 'ghost'}
        onPress={() => onViewChange(id)}
        aria-label={label}
        className={isCurrent ? 'text-accent' : 'text-muted'}
      >
        <Icon size={18} aria-hidden={true} />
      </Button>
    </span>
  )
}

export function AppNavbar({
  view,
  themeLabel,
  onViewChange,
  onThemeChange,
  position = 'left'
}: AppNavbarProps): React.JSX.Element {
  const ThemeIcon = themeLabel === 'Dark' ? Moon : Sun
  const contribution = useFeatureMenuContribution()
  const isLeft = position === 'left'
  const ToggleIcon = isLeft
    ? contribution?.isOpen
      ? PanelLeftClose
      : PanelLeftOpen
    : contribution?.isOpen
      ? PanelRightClose
      : PanelRightOpen

  return (
    <aside
      className={
        isLeft
          ? 'window-drag-region relative mt-10 flex h-[calc(100vh-2.5rem)] w-12 shrink-0 flex-col items-center bg-background/85 px-2 pb-1 pt-2 backdrop-blur'
          : 'window-drag-region mt-10 flex h-[calc(100vh-2.5rem)] w-12 shrink-0 flex-col items-center border-l border-separator bg-background/85 px-2 pb-1 pt-2 backdrop-blur'
      }
      aria-label="Main navigation"
    >
      {isLeft && (
        <span
          className="sidebar-divider absolute right-0 top-1/2 h-2/3 -translate-y-1/2"
          aria-hidden="true"
        />
      )}
      <nav className="mt-1 flex flex-1 flex-col items-center gap-1">
        <AnimatePresence initial={false}>
          {contribution && (
            <motion.div
              key="feature-menu-toggle"
              initial={{ height: 0, opacity: 0, scale: 0.7 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex justify-center overflow-hidden"
            >
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={contribution.onToggle}
                aria-label={`${contribution.isOpen ? 'Close' : 'Open'} ${contribution.label}`}
                aria-expanded={contribution.isOpen}
                className="text-muted"
              >
                <ToggleIcon size={18} aria-hidden={true} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {navItems.map((item) => (
          <motion.div key={item.id} layout transition={{ duration: 0.2, ease: 'easeOut' }}>
            <NavButton {...item} view={view} onViewChange={onViewChange} />
          </motion.div>
        ))}
      </nav>
      <div className="flex flex-col items-center gap-1">
        <NavButton
          id="settings"
          label="Settings"
          icon={Settings}
          view={view}
          onViewChange={onViewChange}
        />
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={onThemeChange}
          aria-label={`Switch theme, currently ${themeLabel}`}
          className="text-muted"
        >
          <ThemeIcon size={17} aria-hidden={true} />
        </Button>
        {isLeft && (
          <Avatar className="mt-1 size-6" aria-label="Account">
            <Avatar.Fallback>IO</Avatar.Fallback>
          </Avatar>
        )}
      </div>
    </aside>
  )
}
