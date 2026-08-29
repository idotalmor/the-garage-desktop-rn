import { useEffect, useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function sendIpc(): void {
  window.electron.ipcRenderer.send('ping')
}

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

function App(): React.JSX.Element {
  const isCompact = useCompact()

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a onClick={sendIpc}>Send IPC</a>
        </div>
        {isCompact && (
          <div className="action">
            <a onClick={openMain}>Open DevFlow</a>
          </div>
        )}
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
