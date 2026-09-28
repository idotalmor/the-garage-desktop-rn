import { useEffect, useState } from 'react'
import { ArrowUpLeft, Brain, ChevronDown, CopyPlus, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@heroui/react'
import { PromptInput } from '@heroui-pro/react'
import { AppNavbar } from '../shared/components/AppNavbar'
import { FeatureMenuProvider, FeatureMenuSlot } from '../shared/components/feature-menu'
import { RecordingControl } from '../shared/components/RecordingControl'
import { FocusControl } from '../features/focus-mode/components/FocusControl'
import type { AppView } from '../shared/components/appNavigation'
import { useCompact } from '../shared/hooks/useCompact'
import { DashboardHome } from '../features/dashboard/components/DashboardHome'
import { GitHubPage } from '../features/github/components/GitHubPage'
import { ArtifactoryWindow } from '../features/github/components/ArtifactoryWindow'
import { NotesPage } from '../features/notes/components/NotesPage'
import { NewsletterPage } from '../features/newsletter/components/NewsletterPage'
import { CodeExplorerPage } from '../features/code-explorer/components/CodeExplorerPage'
import { IntegrationsPage } from '../features/integrations/components/IntegrationsPage'
import { FocusModePage } from '../features/focus-mode/components/FocusModePage'
import { ArtifactoryPage } from '../features/artifactory/pages/artifactory-page'
import { RecordingPage } from '../features/recording/components/RecordingPage'
import { WindowChannel, type OpenWindow } from '../../../shared/window-channels'
import { WindowDragRegion } from '../shared/components/WindowDragRegion'

const promptExamples = [
  'We need to merge experiments',
  'Find the PRs waiting for review',
  'Investigate the failing CI checks'
]

export function AppShell(): React.JSX.Element {
  const isCompact = useCompact()
  const isArtifactory = new URLSearchParams(window.location.search).get('view') === 'artifactory'
  const [view, setView] = useState<AppView>('home')
  const [previousView, setPreviousView] = useState<AppView>('home')
  const { theme, setTheme } = useTheme()
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'
  const [prompt, setPrompt] = useState('')
  const [promptIndex, setPromptIndex] = useState(0)
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [isWindowMenuOpen, setIsWindowMenuOpen] = useState(false)
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([])
  const [isContentScrolled, setIsContentScrolled] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % promptExamples.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isWindowMenuOpen) return

    const refreshWindows = (): void => {
      void window.electron.ipcRenderer
        .invoke(WindowChannel.List)
        .then((windows) => setOpenWindows(windows as OpenWindow[]))
    }

    refreshWindows()
    const timer = window.setInterval(refreshWindows, 1000)
    return () => window.clearInterval(timer)
  }, [isWindowMenuOpen])

  useEffect(() => {
    if (!isCompact) return
    const blurActiveElement = (): void => {
      requestAnimationFrame(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      })
    }
    window.addEventListener('focus', blurActiveElement)
    const timer = setTimeout(blurActiveElement, 150)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', blurActiveElement)
    }
  }, [isCompact])

  const cycleTheme = (): void => {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')
  }

  const toggleFocusPage = (): void => {
    if (view === 'focus-mode') {
      setView(previousView)
    } else {
      setPreviousView(view)
      setView('focus-mode')
    }
  }

  const content =
    view === 'home' ? (
      <DashboardHome />
    ) : view === 'github' ? (
      <GitHubPage />
    ) : view === 'notes' ? (
      <NotesPage />
    ) : view === 'artifactory' ? (
      <ArtifactoryPage />
    ) : view === 'newsletter' ? (
      <NewsletterPage />
    ) : view === 'code-explorer' ? (
      <CodeExplorerPage />
    ) : view === 'integrations' ? (
      <IntegrationsPage />
    ) : view === 'focus-mode' ? (
      <FocusModePage />
    ) : view === 'recording' ? (
      <RecordingPage onBack={() => setView('home')} />
    ) : (
      <DashboardHome />
    )

  const topBarContent = (compact: boolean): React.JSX.Element => (
    <>
      <div
        className={
          compact
            ? 'flex h-7 min-w-0 flex-1 items-center gap-1 px-2'
            : 'absolute left-1/2 flex h-7 w-max max-w-[calc(100%-2rem)] min-w-0 -translate-x-1/2 items-center gap-1'
        }
      >
        <div className="window-top-actions flex shrink-0 items-center gap-1">
          {compact && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="size-7 rounded-full text-muted hover:text-foreground"
              onPress={() => window.electron.ipcRenderer.send(WindowChannel.Promote)}
              aria-label="Open in desktop window"
            >
              <ArrowUpLeft size={15} aria-hidden="true" />
            </Button>
          )}
          <RecordingControl onOpen={() => setView('recording')} />
        </div>
        <div
          className={`window-prompt-bar flex h-7 min-w-0 items-center gap-1.5 rounded-md border border-border/60 bg-transparent px-2 text-xs ${
            compact ? 'flex-1' : 'w-[420px]'
          }`}
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
        <FocusControl isFocusPage={view === 'focus-mode'} onToggleFocusPage={toggleFocusPage} />
      </div>
      <div
        className={
          compact
            ? 'relative flex shrink-0 items-center gap-1 pr-2'
            : 'absolute right-3 flex items-center gap-1'
        }
      >
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="size-7 rounded-full text-muted hover:text-foreground"
          onPress={() => void window.electron.ipcRenderer.invoke(WindowChannel.Duplicate)}
          aria-label="Open duplicate window"
        >
          <CopyPlus size={15} aria-hidden="true" />
        </Button>
        <div className="relative">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="size-7 rounded-full text-muted hover:text-foreground"
            onPress={() => setIsWindowMenuOpen((open) => !open)}
            aria-label="Show open windows"
            aria-expanded={isWindowMenuOpen}
          >
            <ChevronDown size={15} aria-hidden="true" />
          </Button>
          {isWindowMenuOpen && (
            <div
              className="absolute right-0 top-8 z-50 w-56 rounded-xl border border-border bg-overlay p-1.5 shadow-overlay"
              role="menu"
              aria-label="Open windows"
            >
              {openWindows.length > 0 ? (
                openWindows.map((openWindow, index) => (
                  <button
                    key={openWindow.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-surface-secondary"
                    role="menuitem"
                    onClick={() => {
                      window.electron.ipcRenderer.send(WindowChannel.Focus, openWindow.id)
                      setIsWindowMenuOpen(false)
                    }}
                  >
                    <span className="truncate">{`${openWindow.title} ${index + 1}`}</span>
                    {openWindow.isFocused && (
                      <span className="ml-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    )}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-muted">No open windows</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )

  const promptOverlay = isPromptOpen ? (
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
  ) : null

  if (isArtifactory) return <ArtifactoryWindow />
  if (new URLSearchParams(window.location.search).get('artifactoryWindow') === '1') {
    return (
      <div className="relative h-screen overflow-hidden bg-background text-foreground">
        <WindowDragRegion className="fixed inset-x-0 top-0 z-30 h-10" />
        <ArtifactoryPage />
      </div>
    )
  }

  if (isCompact) {
    return (
      <FeatureMenuProvider>
        <div className="popover-shell flex h-screen flex-col overflow-hidden rounded-2xl bg-background text-foreground">
          <WindowDragRegion
            className={`app-top-bar fixed inset-x-0 top-0 z-30 flex h-10 items-center bg-background/60 backdrop-blur-md ${isContentScrolled ? 'is-scrolled' : ''}`}
          >
            {topBarContent(true)}
          </WindowDragRegion>
          <div className="flex min-h-0 flex-1">
            <AppNavbar
              position="left"
              view={view}
              themeLabel={themeLabel}
              onViewChange={setView}
              onThemeChange={cycleTheme}
            />
            <FeatureMenuSlot className="flex pt-10" />
            <main
              className="min-w-0 flex-1 overflow-y-auto"
              onScroll={(event) => setIsContentScrolled(event.currentTarget.scrollTop > 0)}
            >
              {content}
            </main>
          </div>
          {promptOverlay}
        </div>
      </FeatureMenuProvider>
    )
  }

  return (
    <FeatureMenuProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <WindowDragRegion
          className={`app-top-bar fixed inset-x-0 top-0 z-30 flex h-10 items-center bg-background/60 backdrop-blur-md ${isContentScrolled ? 'is-scrolled' : ''}`}
        >
          {topBarContent(false)}
        </WindowDragRegion>
        <AppNavbar
          view={view}
          themeLabel={themeLabel}
          onViewChange={setView}
          onThemeChange={cycleTheme}
        />
        <FeatureMenuSlot className="flex pt-10" />
        <main
          className="h-full min-w-0 flex-1 overflow-y-auto"
          onScroll={(event) => setIsContentScrolled(event.currentTarget.scrollTop > 0)}
        >
          {content}
        </main>
        {promptOverlay}
      </div>
    </FeatureMenuProvider>
  )
}
