import {
  ChevronDown,
  CodeXml,
  GitBranch,
  GitCommitHorizontal,
  Terminal,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@heroui/react'
import { Widget } from '@heroui-pro/react'
import type { Worktree } from './types'

export interface GitHubCardSpec {
  key: string
  title: React.ReactNode
  titleClass?: string
  surfaceClass?: string
  overflowVisible?: boolean
  aside?: React.ReactNode
  history?: {
    hasUncommitted?: boolean
    onOpen: () => void
  }
  body?: React.ReactNode
  footer?: React.ReactNode
  footerDisabled?: boolean
}

export function GitHubCard({
  title,
  titleClass,
  surfaceClass,
  overflowVisible,
  aside,
  history,
  body,
  footer,
  footerDisabled
}: Omit<GitHubCardSpec, 'key'>): React.JSX.Element {
  return (
    <Widget
      className={`w-52 sm:w-80 shadow-surface ${overflowVisible ? 'overflow-visible' : ''} ${surfaceClass ?? ''}`}
    >
      <Widget.Content
        className={`m-1 flex min-h-[140px] flex-col gap-1 p-2.5 ${overflowVisible ? 'overflow-visible' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className={`line-clamp-3 min-w-0 text-sm font-semibold ${titleClass ?? ''}`}>
            <GitBranch
              size={13}
              className="mr-1.5 inline-block align-[-0.15em] text-muted"
              aria-hidden="true"
            />
            {title}
          </h3>
          {(aside || history) && (
            <div className="flex shrink-0 items-start gap-1">
              {history && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className={`size-6 min-h-6 ${
                    history.hasUncommitted
                      ? 'bg-warning/15 text-warning'
                      : 'text-muted hover:text-foreground'
                  }`}
                  onPress={history.onOpen}
                  aria-label="Commit history"
                >
                  <GitCommitHorizontal size={14} />
                </Button>
              )}
              {aside}
            </div>
          )}
        </div>
        {body}
        <div className="flex-1" />
        {footer && (
          <div
            className={`flex flex-wrap items-center gap-1 border-t border-separator pt-1.5 ${footerDisabled ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={footerDisabled || undefined}
          >
            {footer}
          </div>
        )}
      </Widget.Content>
    </Widget>
  )
}

export function GithubIcon({ size = 14 }: { size?: number }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function CursorLogo({ size = 12 }: { size?: number }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M11.925 24l10.425-6-10.425-6L1.5 18l10.425 6z"
        fill="currentColor"
        fillOpacity="0.35"
      />
      <path d="M22.35 18V6L11.925 0v12l10.425 6z" fill="currentColor" fillOpacity="0.6" />
      <path d="M11.925 0L1.5 6v12l10.425-6V0z" fill="currentColor" />
      <path d="M22.35 6L11.925 24V12L22.35 6z" fill="currentColor" fillOpacity="0.85" />
      <path d="M22.35 6l-10.425 6L1.5 6l10.425-6z" fill="currentColor" fillOpacity="0.5" />
      <path d="M22.35 6l-10.425 6L1.5 6l10.425-6z" fill="currentColor" fillOpacity="0.5" />
    </svg>
  )
}

export function FinderIcon({ size = 14 }: { size?: number }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="4.5" fill="#eceef1" />
      <path d="M6.5 2H12v20H6.5A4.5 4.5 0 0 1 2 17.5v-11A4.5 4.5 0 0 1 6.5 2z" fill="#4ea1f8" />
      <path d="M12 2v20" stroke="#d4d4d8" strokeWidth="0.75" />
      <path d="M8.5 6.5v3M15.5 6.5v3" stroke="#1d1d1f" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M7.5 14.5c1.2 1.4 2.8 2 4.5 2s3.3-.6 4.5-2"
        stroke="#1d1d1f"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

const ides = [
  { id: 'cursor', name: 'Cursor', icon: <CursorLogo size={12} /> },
  { id: 'vscode', name: 'VS Code', icon: <CodeXml size={12} /> },
  { id: 'terminal', name: 'Terminal', icon: <Terminal size={12} /> }
] as const

export function IdePicker({
  worktreeName,
  path,
  onOpen
}: {
  worktreeName: string
  path: string
  onOpen: (ide: string, path: string) => void
}): React.JSX.Element {
  const [selectedIde, setSelectedIde] = useState<(typeof ides)[number]['id']>('cursor')
  const [isOpen, setIsOpen] = useState(false)
  const selected = ides.find((ide) => ide.id === selectedIde) ?? ides[0]
  return (
    <div className="relative flex h-7 items-stretch rounded-lg border border-border bg-surface text-[10px]">
      <button
        type="button"
        aria-label={`Open ${worktreeName} in ${selected.name}`}
        className="flex items-center gap-1.5 rounded-l-lg px-2 hover:bg-surface-secondary"
        onClick={() => onOpen(selected.id, path)}
      >
        {selected.icon}
      </button>
      <span className="w-px bg-separator" aria-hidden="true" />
      <button
        type="button"
        aria-label={`Choose IDE for ${worktreeName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center rounded-r-lg px-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
        onClick={() => setIsOpen((open) => !open)}
      >
        <ChevronDown size={11} aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          role="menu"
          aria-label="Choose IDE"
          className="absolute left-0 top-8 z-50 w-36 rounded-xl border border-border bg-overlay p-1.5 shadow-overlay"
        >
          {ides.map((ide) => (
            <button
              key={ide.id}
              type="button"
              role="menuitemradio"
              aria-checked={ide.id === selectedIde}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-surface-secondary"
              onClick={() => {
                setSelectedIde(ide.id)
                setIsOpen(false)
              }}
            >
              {ide.icon}
              <span>{ide.name}</span>
              {ide.id === selectedIde && (
                <span className="ml-auto size-1.5 shrink-0 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Small pill for a worktree's sync state (behind, ahead, unpushed, missing). */
export function SyncChip({
  hint,
  danger,
  children
}: {
  hint: string
  danger?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <span
      title={hint}
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-medium ${
        danger ? 'bg-danger/15 text-danger' : 'bg-surface-secondary text-muted'
      }`}
    >
      {children}
    </span>
  )
}

/** Icon-only button in a card footer (open in Finder, delete). */
export function FooterAction({
  label,
  onPress,
  danger,
  className = '',
  children
}: {
  label: string
  onPress: () => void
  danger?: boolean
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      className={`size-7 min-h-7 ${danger ? 'text-muted hover:text-danger' : 'text-muted hover:text-foreground'} ${className}`}
      onPress={onPress}
      aria-label={label}
    >
      {children}
    </Button>
  )
}

/** The checkout actions a card with a local folder gets: IDE picker, Finder, delete (not for the main checkout). */
export function CheckoutActions({
  worktree,
  onOpenIde,
  onOpenFolder,
  onDelete
}: {
  worktree: Worktree
  onOpenIde: (ide: string, path: string) => void
  onOpenFolder: (path: string) => void
  onDelete: (worktree: Worktree) => void
}): React.JSX.Element {
  return (
    <>
      <IdePicker worktreeName={worktree.name} path={worktree.path ?? ''} onOpen={onOpenIde} />
      <FooterAction label="Open in Finder" onPress={() => onOpenFolder(worktree.path ?? '')}>
        <FinderIcon size={14} />
      </FooterAction>
      {!worktree.isMain && (
        <FooterAction
          label={`Delete ${worktree.name}`}
          danger
          className="ml-auto"
          onPress={() => onDelete(worktree)}
        >
          <Trash2 size={13} />
        </FooterAction>
      )}
    </>
  )
}
