import {
  BookOpen,
  Check,
  ChevronRight,
  FileCode2,
  FolderGit2,
  Headphones,
  Layers3,
  Play,
  Plus,
  Search,
  Sparkles
} from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Chip } from '@heroui/react'
import { PageHeader } from '../../../shared/components/PageHeader'

type OutputType = 'Docs' | 'Podcast'

const repositories = [
  { name: 'platform-api', detail: 'acme/platform-api', files: '248 files', color: 'bg-violet-400' },
  { name: 'web-console', detail: 'acme/web-console', files: '182 files', color: 'bg-cyan-400' },
  {
    name: 'shared-contracts',
    detail: 'acme/shared-contracts',
    files: '74 files',
    color: 'bg-amber-400'
  }
]

const sourceFiles = [
  { name: 'deployment-health.md', repo: 'platform-api', kind: 'Markdown' },
  { name: 'incident-timeline.tsx', repo: 'web-console', kind: 'React' },
  { name: 'release-notes.md', repo: 'shared-contracts', kind: 'Markdown' }
]

export function CodeExplorerPage(): React.JSX.Element {
  const [outputType, setOutputType] = useState<OutputType>('Docs')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)

  const generate = (): void => {
    setIsGenerating(true)
    window.setTimeout(() => {
      setIsGenerating(false)
      setIsGenerated(true)
    }, 500)
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-14 sm:px-6 lg:pt-16">
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-1">
            <Layers3 size={13} aria-hidden="true" /> Cross-repo context
          </span>
        }
        title="Code Explorer"
        description="Trace a story across repositories, then turn the useful context into docs or a podcast outline."
      />

      <section
        className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]"
        aria-label="Code explorer workspace"
      >
        <Card className="h-fit">
          <Card.Header className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Repositories</Card.Title>
                <Card.Description>3 connected sources</Card.Description>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="size-7 rounded-lg"
                aria-label="Add repository"
                onPress={() => {}}
              >
                <Plus size={15} aria-hidden="true" />
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="space-y-1 px-3 pb-4">
            {repositories.map((repository, index) => (
              <Button
                key={repository.name}
                fullWidth
                size="sm"
                variant={index === 0 ? 'secondary' : 'ghost'}
                className="h-auto justify-start rounded-xl px-3 py-2.5 text-start"
                onPress={() => {}}
              >
                <span className={`size-2 shrink-0 rounded-full ${repository.color}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{repository.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">
                    {repository.files}
                  </span>
                </span>
                <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden="true" />
              </Button>
            ))}
          </Card.Content>
        </Card>

        <Card className="min-w-0">
          <Card.Header className="border-b border-separator p-5 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Card.Title>Explore the codebase</Card.Title>
                <Card.Description>Search for the concepts that connect the repos.</Card.Description>
              </div>
              <div
                className="flex h-8 min-w-52 items-center gap-2 rounded-lg border border-border bg-surface-secondary px-2.5 text-xs text-muted"
                role="search"
                aria-label="Search codebase"
              >
                <Search size={14} aria-hidden="true" />
                <span>Search symbols, files, or concepts</span>
              </div>
            </div>
          </Card.Header>
          <Card.Content className="space-y-3 p-5">
            <div className="rounded-2xl bg-surface-secondary p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-accent">
                <Sparkles size={14} aria-hidden="true" /> Suggested thread
              </div>
              <p className="mt-2 text-sm font-medium">
                How deployment health flows from API to console
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                12 related files across 3 repositories · last changed 2 days ago
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['health checks', 'incident timeline', 'release notes'].map((tag) => (
                  <Chip key={tag} size="sm" variant="soft">
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              {sourceFiles.map((file) => (
                <Button
                  key={file.name}
                  fullWidth
                  variant="ghost"
                  className="h-auto justify-start rounded-xl px-3 py-3 text-start"
                  onPress={() => {}}
                >
                  <FileCode2 size={16} className="shrink-0 text-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{file.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {file.repo} · {file.kind}
                    </span>
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden="true" />
                </Button>
              ))}
            </div>
          </Card.Content>
        </Card>

        <Card className="h-fit">
          <Card.Header className="p-5 pb-3">
            <Card.Title>Create an output</Card.Title>
            <Card.Description>Choose a format for the selected context.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4 px-5 pb-5">
            <div
              className="grid grid-cols-2 gap-2 rounded-xl bg-surface-secondary p-1"
              role="tablist"
              aria-label="Output type"
            >
              {(['Docs', 'Podcast'] as OutputType[]).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={outputType === type ? 'secondary' : 'ghost'}
                  className="rounded-lg text-xs"
                  onPress={() => setOutputType(type)}
                  aria-selected={outputType === type}
                >
                  {type === 'Docs' ? (
                    <BookOpen size={14} aria-hidden="true" />
                  ) : (
                    <Headphones size={14} aria-hidden="true" />
                  )}
                  {type}
                </Button>
              ))}
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs font-medium">
                {outputType === 'Docs'
                  ? 'Release architecture guide'
                  : 'The path to calmer releases'}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {outputType === 'Docs'
                  ? 'Structure, decisions, and examples.'
                  : 'A 12-minute conversation outline with chapter beats.'}
              </p>
            </div>
            <Button
              fullWidth
              size="sm"
              variant="primary"
              className="rounded-lg"
              onPress={generate}
              isPending={isGenerating}
            >
              <Play size={14} aria-hidden="true" />
              Generate {outputType.toLowerCase()}
            </Button>
            {isGenerated && (
              <p className="flex items-center gap-2 text-xs text-success">
                <Check size={14} aria-hidden="true" /> {outputType} draft is ready in Notes.
              </p>
            )}
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <FolderGit2 size={13} aria-hidden="true" /> Context stays linked to source files.
            </div>
          </Card.Content>
        </Card>
      </section>
    </main>
  )
}
