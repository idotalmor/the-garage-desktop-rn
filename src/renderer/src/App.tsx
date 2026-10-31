import { AppShell } from './app/AppShell'
import { AuthGate } from './features/auth/components/AuthGate'
import { useReportReady } from './features/app-updates/hooks/use-report-ready'

function App(): React.JSX.Element {
  useReportReady()
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  )
}

export default App
