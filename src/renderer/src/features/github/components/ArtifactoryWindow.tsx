import { FileText, Search } from 'lucide-react'
import { Button } from '@heroui/react'

const contextFiles = [
  { name: 'task-184.md', kind: 'md', repo: 'platform-api' },
  { name: 'auth-refactor.md', kind: 'md', repo: 'platform-api' },
  { name: 'editor-installation.md', kind: 'md', repo: 'web-console' },
  { name: 'on-call-runbook.md', kind: 'md', repo: 'web-console' },
  { name: 'api-contract.json', kind: 'json', repo: 'platform-api' },
  { name: 'design.figma', kind: 'figma', repo: 'web-console' }
]

function FileIcon({ kind }: { kind: string }): React.JSX.Element {
  if (kind === 'json') return <span className="font-mono text-warning">{'{ }'}</span>
  if (kind === 'figma') return <span className="font-mono text-danger">F</span>
  return <FileText size={16} aria-hidden="true" />
}

export function ArtifactoryWindow(): React.JSX.Element {
  return (
    <main className="h-screen overflow-y-auto bg-background p-6 text-foreground">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Artifactory context</h1>
          <p className="text-sm text-muted">Files and references linked to this task.</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-lg" onPress={() => window.close()}>
          Close
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {contextFiles.map((file) => (
          <div
            key={file.name}
            tabIndex={0}
            className="flex cursor-default items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-accent">
              <FileIcon kind={file.kind} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted">{file.repo}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <Search size={22} className="mx-auto text-muted" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted">Search or link more context files here.</p>
      </section>
    </main>
  )
}
