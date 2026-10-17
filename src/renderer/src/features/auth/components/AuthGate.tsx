import { useAuth } from '../hooks/use-auth'
import { LoginPage } from './LoginPage'

function SplashScreen(): React.JSX.Element {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <span className="text-sm text-muted">Loading…</span>
    </div>
  )
}

export function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { status, isConfigured } = useAuth()

  if (isConfigured && status === 'loading') return <SplashScreen />
  if (!isConfigured || status === 'signed-out') return <LoginPage />
  return <>{children}</>
}
