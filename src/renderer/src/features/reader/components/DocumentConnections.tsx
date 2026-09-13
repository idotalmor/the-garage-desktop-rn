import { ExternalLink, FolderOpen, GitPullRequest } from 'lucide-react'
import { Button } from '@heroui/react'
import { ReaderChannel } from '../../../../../shared/reader/channels'

export function DocumentConnections({ path }: { path: string }): React.JSX.Element {
  return (
    <div className="mt-2 flex items-center gap-1" aria-label="Connected work items">
      <div className="flex items-center overflow-hidden rounded-md border border-border">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 min-h-6 rounded-none border-r border-border px-2 text-[11px] text-muted hover:text-foreground"
          onPress={() => window.open('https://jira', '_blank')}
        >
          <span className="flex size-3.5 items-center justify-center rounded-sm bg-warning text-[9px] font-bold text-warning-foreground">
            J
          </span>
          Open Jira ticket
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 min-h-6 rounded-none border-r border-border px-2 text-[11px] text-muted hover:text-foreground"
          onPress={() => window.open('https://github.com', '_blank')}
        >
          <GitPullRequest size={13} aria-hidden="true" />
          Linked PRs
          <span className="rounded-full bg-surface-secondary px-1.5 text-[10px] text-foreground">
            2
          </span>
          <ExternalLink size={11} aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 min-h-6 rounded-none px-2 text-[11px] text-muted hover:text-foreground"
          onPress={() => window.electron.ipcRenderer.invoke(ReaderChannel.ShowInFolder, path)}
        >
          <FolderOpen size={13} aria-hidden="true" />
          Show in Finder
        </Button>
      </div>
    </div>
  )
}
