import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'

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

export function Dashboard(): React.JSX.Element {
  const isCompact = useCompact()

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
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm">
                Notes
              </Button>
              <Button variant="ghost" size="sm">
                Settings
              </Button>
            </>
          )}
        </div>
      </nav>

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
    </div>
  )
}
