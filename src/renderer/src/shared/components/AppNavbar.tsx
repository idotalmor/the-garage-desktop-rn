import { Moon, Settings, Sun } from 'lucide-react'
import { Avatar, Button } from '@heroui/react'
import { navItems, type AppView } from './appNavigation'

type AppNavbarProps = {
  view: AppView
  themeLabel: string
  onViewChange: (view: AppView) => void
  onThemeChange: () => void
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
  )
}

export function AppNavbar({
  view,
  themeLabel,
  onViewChange,
  onThemeChange
}: AppNavbarProps): React.JSX.Element {
  const ThemeIcon = themeLabel === 'Dark' ? Moon : Sun

  return (
    <aside
      className="window-drag-region fixed inset-y-0 left-0 z-20 flex h-screen w-12 flex-col items-center bg-background/85 px-2 pb-1 pt-9 backdrop-blur"
      aria-label="Main navigation"
    >
      <span
        className="sidebar-divider absolute right-0 top-1/2 h-2/3 -translate-y-1/2"
        aria-hidden="true"
      />
      <nav className="mt-1 flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => (
          <NavButton key={item.id} {...item} view={view} onViewChange={onViewChange} />
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
          <ThemeIcon size={17} aria-hidden="true" />
        </Button>
        <Avatar className="mt-1 size-6" aria-label="Account">
          <Avatar.Fallback>IO</Avatar.Fallback>
        </Avatar>
      </div>
    </aside>
  )
}
