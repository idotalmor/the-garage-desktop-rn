import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button, Card } from '@heroui/react'
import { Navbar } from '@heroui-pro/react'
import { Notes } from './Notes'
import { Reader } from './Reader'

function openMain(): void {
  window.electron.ipcRenderer.send('app:open-main')
}

function useCompact(): boolean {
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 600px)').matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 600px)')
    const onChange = (event: MediaQueryListEvent): void => setIsCompact(event.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return isCompact
}

function Home(): React.JSX.Element {
  return (
    <main className="p-4 sm:p-6">
      <Card className="w-full max-w-3xl mx-auto">
        <Card.Header>
          <Card.Title className="text-xl sm:text-2xl">Welcome to DevFlow</Card.Title>
          <Card.Description>Your mission control for AI-driven development.</Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-muted">
            Track tasks, pull requests, notes, and agent workflows from one place.
          </p>
        </Card.Content>
        <Card.Footer>
          <Button variant="primary" onPress={() => {}}>
            Get Started
          </Button>
          <Button variant="outline" onPress={() => {}}>
            Documentation
          </Button>
        </Card.Footer>
      </Card>
    </main>
  )
}

function ThemeToggle(): React.JSX.Element {
  const { theme, setTheme } = useTheme()

  const label =
    theme === 'system'
      ? 'System'
      : theme === 'dark'
        ? 'Dark'
        : theme === 'light'
          ? 'Light'
          : 'System'

  const cycle = (): void => {
    if (theme === 'dark') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('system')
    } else {
      setTheme('dark')
    }
  }

  return (
    <Button variant="ghost" size="sm" onPress={cycle}>
      {label}
    </Button>
  )
}

export function Dashboard(): React.JSX.Element {
  const isCompact = useCompact()
  const [view, setView] = useState<'home' | 'notes' | 'reader'>('home')

  const navButton = (target: 'home' | 'notes' | 'reader', label: string): React.JSX.Element => (
    <Button
      variant={view === target ? 'primary' : 'ghost'}
      size="sm"
      onPress={() => setView(target)}
    >
      {label}
    </Button>
  )

  if (isCompact) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="flex h-12 items-center justify-between">
          <span className="text-lg font-semibold">DevFlow</span>
          <Button variant="primary" size="sm" onPress={() => openMain()}>
            Open DevFlow
          </Button>
        </div>
        {view === 'home' ? <Home /> : view === 'notes' ? <Notes /> : <Reader />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar className="border-b border-(--border)" position="static">
        <Navbar.Header>
          <Navbar.Brand className="font-bold text-lg">DevFlow</Navbar.Brand>
          <Navbar.Content className="hidden sm:flex">
            {navButton('home', 'Dashboard')}
            {navButton('notes', 'Notes')}
            {navButton('reader', 'Reader')}
            <Button variant="ghost" size="sm" onPress={() => {}}>
              Settings
            </Button>
          </Navbar.Content>
          <Navbar.Content className="ml-auto">
            <ThemeToggle />
          </Navbar.Content>
        </Navbar.Header>
      </Navbar>

      {view === 'home' ? <Home /> : view === 'notes' ? <Notes /> : <Reader />}
    </div>
  )
}
