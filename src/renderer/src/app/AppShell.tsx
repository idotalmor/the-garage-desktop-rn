import { useEffect, useState } from 'react'
import { Brain, MicAudioLines, Moon, Plus, Settings, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@heroui/react'
import { PromptInput } from '@heroui-pro/react'
import { AppNavbar, NavButton } from '../shared/components/AppNavbar'
import { navItems, type AppView } from '../shared/components/appNavigation'
import { useCompact } from '../shared/hooks/useCompact'
import { DashboardHome } from '../features/dashboard/components/DashboardHome'
import { GitHubPage } from '../features/github/components/GitHubPage'
import { ArtifactoryWindow } from '../features/github/components/ArtifactoryWindow'
import { NotesPage } from '../features/notes/components/NotesPage'
import { NewsletterPage } from '../features/newsletter/components/NewsletterPage'
import { CodeExplorerPage } from '../features/code-explorer/components/CodeExplorerPage'
import { ReaderPage } from '../features/reader/ReaderPage'

function openMain(): void {
  window.electron.ipcRenderer.send('app:open-main')
}

const promptExamples = [
  'We need to merge experiments',
  'Find the PRs waiting for review',
  'Investigate the failing CI checks'
]

export function AppShell(): React.JSX.Element {
  const isCompact = useCompact()
  const isArtifactory = new URLSearchParams(window.location.search).get('view') === 'artifactory'
  const [view, setView] = useState<AppView>('home')
  const { theme, setTheme } = useTheme()
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'
  const ThemeIcon = themeLabel === 'Dark' ? Moon : Sun
  const [prompt, setPrompt] = useState('')
  const [promptIndex, setPromptIndex] = useState(0)
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isContentScrolled, setIsContentScrolled] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % promptExamples.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [])

  const cycleTheme = (): void => {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')
  }

  const content =
    view === 'home' ? (
      <DashboardHome />
    ) : view === 'github' ? (
      <GitHubPage />
    ) : view === 'notes' ? (
      <NotesPage />
    ) : view === 'reader' ? (
      <ReaderPage />
    ) : view === 'newsletter' ? (
      <NewsletterPage />
    ) : view === 'code-explorer' ? (
      <CodeExplorerPage />
    ) : (
      <DashboardHome />
    )

  if (isArtifactory) return <ArtifactoryWindow />
  if (new URLSearchParams(window.location.search).get('readerWindow') === '1') {
    return <ReaderPage />
  }

  if (isCompact) {
    return (
      <div className="h-screen overflow-y-auto bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-separator px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Brain size={17} aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold">The Orchestrator</span>
          </div>
          <Button variant="outline" size="sm" onPress={openMain}>
            Open app
          </Button>
        </header>
        <div className="flex items-center justify-between border-b border-separator px-3 py-2">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavButton key={item.id} {...item} view={view} onViewChange={setView} />
            ))}
            <NavButton
              id="settings"
              label="Settings"
              icon={Settings}
              view={view}
              onViewChange={setView}
            />
          </nav>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={cycleTheme}
            aria-label={`Switch theme, currently ${themeLabel}`}
          >
            <ThemeIcon size={16} aria-hidden={true} />
          </Button>
        </div>
        {content}
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden bg-background text-foreground">
      <div
        className={`window-drag-region app-top-bar fixed inset-x-0 top-0 z-30 flex h-10 items-center bg-background/60 backdrop-blur-md ${isContentScrolled ? 'is-scrolled' : ''}`}
      >
        <div className="absolute left-1/2 flex h-7 w-[min(500px,calc(100vw-2rem))] -translate-x-1/2 items-center gap-1">
          <div className="window-top-actions flex shrink-0 items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className={`size-7 rounded-full ${isRecording ? 'animate-pulse bg-danger text-danger-foreground' : 'border border-danger/60 text-danger hover:bg-danger/15'}`}
              onPress={() => setIsRecording((recording) => !recording)}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <MicAudioLines size={15} aria-hidden="true" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-7 rounded-md text-muted hover:text-foreground"
              onPress={() => {
                setPrompt('')
                setIsPromptOpen(true)
              }}
              aria-label="Create new prompt"
            >
              <Plus size={15} aria-hidden="true" />
            </Button>
          </div>
          <div
            className="window-prompt-bar flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border/60 bg-transparent px-2 text-xs"
            role="button"
            tabIndex={0}
            aria-label="Open command prompt"
            onClick={() => setIsPromptOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setIsPromptOpen(true)
            }}
          >
            <Brain size={13} className="shrink-0 text-foreground/60" aria-hidden={true} />
            <span key={promptIndex} className="prompt-example min-w-0 truncate text-xs text-muted">
              {prompt || promptExamples[promptIndex]}
            </span>
          </div>
        </div>
      </div>
      {isPromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/35 px-4 pt-16 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsPromptOpen(false)
          }}
        >
          <section
            className="w-full max-w-2xl rounded-lg border border-border bg-background p-3 shadow-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-dialog-title"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <div>
                <h2 id="prompt-dialog-title" className="text-sm font-semibold">
                  Command prompt
                </h2>
                <p className="text-xs text-muted">Describe what you want to move forward.</p>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="rounded-md"
                aria-label="Close command prompt"
                onPress={() => setIsPromptOpen(false)}
              >
                <X size={15} aria-hidden={true} />
              </Button>
            </div>
            <PromptInput
              value={prompt}
              onValueChange={setPrompt}
              onSubmit={() => setIsPromptOpen(false)}
            >
              <PromptInput.Shell className="border border-border shadow-none">
                <PromptInput.Content>
                  <PromptInput.TextArea
                    autoFocus
                    className="min-h-32"
                    placeholder="Write a prompt, merge request, or investigation plan..."
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setIsPromptOpen(false)
                    }}
                  />
                </PromptInput.Content>
              </PromptInput.Shell>
            </PromptInput>
          </section>
        </div>
      )}
      <AppNavbar
        view={view}
        themeLabel={themeLabel}
        onViewChange={setView}
        onThemeChange={cycleTheme}
      />
      <div
        className="ml-12 h-screen min-w-0 overflow-y-auto"
        onScroll={(event) => setIsContentScrolled(event.currentTarget.scrollTop > 0)}
      >
        {content}
      </div>
    </div>
  )
}
