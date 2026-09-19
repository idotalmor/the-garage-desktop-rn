import { FileText, Home, Mail, Package, ScanSearch } from 'lucide-react'
import { createElement, type ReactElement } from 'react'

function GitHubIcon({ size = 18 }: { size?: number }): ReactElement {
  return createElement(
    'svg',
    { viewBox: '0 0 24 24', width: size, height: size, fill: 'currentColor', 'aria-hidden': true },
    createElement('path', {
      d: 'M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z'
    })
  )
}

export type AppView =
  | 'home'
  | 'github'
  | 'notes'
  | 'reader'
  | 'artifactory'
  | 'newsletter'
  | 'code-explorer'
  | 'settings'

export const navItems = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'github' as const, label: 'GitHub', icon: GitHubIcon },
  { id: 'notes' as const, label: 'Notes', icon: FileText },
  { id: 'reader' as const, label: 'Artifactory', icon: Package },
  { id: 'newsletter' as const, label: 'Newsletter', icon: Mail },
  { id: 'code-explorer' as const, label: 'Code Explorer', icon: ScanSearch }
]
