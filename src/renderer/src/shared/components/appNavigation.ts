import { Blocks, FileText, Library, Mail, ScanSearch } from 'lucide-react'
import { createElement, type ReactElement } from 'react'

function AppMarkIcon({ size = 18 }: { size?: number }): ReactElement {
  return createElement(
    'svg',
    {
      viewBox: '0 0 256 256',
      width: size,
      height: size,
      fill: 'currentColor',
      'aria-hidden': true
    },
    createElement('path', {
      d: 'M 183.022461 164.766357 L 234.995117 152.998901 L 234.995117 204.99646 L 220.995728 218.995819 L 140.964478 192.029114 L 187.121338 221.142731 L 150.264038 258 L 130.417969 258 L 93.233643 183.022522 L 105.001099 234.995087 L 53.00354 234.995087 L 39.00415 220.995728 L 65.970947 140.964478 L 36.8573 187.121277 L 0 150.264038 L 0 130.417969 L 74.977539 93.233643 L 23.004883 105.00116 L 23.004883 53.00354 L 37.004272 39.004211 L 117.035522 65.970947 L 70.878784 36.8573 L 107.735962 0 L 127.582031 0 L 164.766357 74.977539 L 152.998901 23.004944 L 204.99646 23.004944 L 218.99585 37.004272 L 192.029053 117.035583 L 221.1427 70.878723 L 258 107.735962 L 258 127.582092 Z'
    })
  )
}

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
  | 'artifactory'
  | 'newsletter'
  | 'code-explorer'
  | 'integrations'
  | 'focus-mode'
  | 'recording'
  | 'settings'

export const navItems = [
  { id: 'home' as const, label: 'Home', icon: AppMarkIcon },
  { id: 'github' as const, label: 'GitHub', icon: GitHubIcon },
  { id: 'notes' as const, label: 'Notes', icon: FileText },
  { id: 'artifactory' as const, label: 'Artifactory', icon: Library },
  { id: 'newsletter' as const, label: 'Newsletter', icon: Mail },
  { id: 'code-explorer' as const, label: 'Code Explorer', icon: ScanSearch },
  { id: 'integrations' as const, label: 'Integrations', icon: Blocks }
]
