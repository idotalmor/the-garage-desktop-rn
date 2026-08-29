import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { Notes } from './Notes'

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
      <Card className="w-full max-w-3xl mx-auto p-4 sm:p-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Welcome to DevFlow</h1>
        <p className="mt-2 text-muted">Your mission control for AI-driven development.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" onPress={() => {}}>
            Get Started
          </Button>
          <Button variant="outline" onPress={() => {}}>
            Documentation
          </Button>
        </div>
      </Card>
    </main>
  )
}

export function Dashboard(): React.JSX.Element {
  const isCompact = useCompact()
  const [view, setView] = useState<'home' | 'notes'>('home')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold sm:text-xl">DevFlow</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {isCompact ? (
            <Button variant="primary" size="sm" onPress={() => openMain()}>
              Open DevFlow
            </Button>
          ) : (
            <>
              <Button
                variant={view === 'home' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setView('home')}
              >
                Dashboard
              </Button>
              <Button
                variant={view === 'notes' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setView('notes')}
              >
                Notes
              </Button>
              <Button variant="ghost" size="sm" onPress={() => {}}>
                Settings
              </Button>
            </>
          )}
        </div>
      </nav>

      {view === 'home' ? <Home /> : <Notes />}
    </div>
  )
}
