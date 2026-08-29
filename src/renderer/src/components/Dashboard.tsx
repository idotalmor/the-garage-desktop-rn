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

export function Dashboard(): React.JSX.Element {
  const isCompact = useCompact()
  const [view, setView] = useState<'home' | 'notes' | 'reader'>('home')
  const { theme, setTheme } = useTheme()

  const themeLabel =
    theme === 'system'
      ? 'System'
      : theme === 'dark'
        ? 'Dark'
        : theme === 'light'
          ? 'Light'
          : 'System'

  const cycleTheme = (): void => {
    if (theme === 'dark') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('system')
    } else {
      setTheme('dark')
    }
  }

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
          <Navbar.Brand>
            <span className="font-bold text-lg">DevFlow</span>
            <span className="sr-only">DevFlow</span>
          </Navbar.Brand>

          <Navbar.Spacer />

          <Navbar.Content>
            <Navbar.Item onClick={() => setView('home')} isCurrent={view === 'home'}>
              Dashboard
            </Navbar.Item>
            <Navbar.Item onClick={() => setView('notes')} isCurrent={view === 'notes'}>
              Notes
            </Navbar.Item>
            <Navbar.Item onClick={() => setView('reader')} isCurrent={view === 'reader'}>
              Reader
            </Navbar.Item>
            <Navbar.Item onClick={() => {}}>Settings</Navbar.Item>
          </Navbar.Content>

          <Navbar.Spacer />

          <Navbar.Content>
            <Navbar.Separator />
            <Navbar.Item onClick={cycleTheme}>{themeLabel}</Navbar.Item>
          </Navbar.Content>
        </Navbar.Header>
      </Navbar>

      {view === 'home' ? <Home /> : view === 'notes' ? <Notes /> : <Reader />}
    </div>
  )
}
