import { AppShell } from './app/AppShell'
import { AuthGate } from './features/auth/components/AuthGate'

function App(): React.JSX.Element {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  )
}

export default App
