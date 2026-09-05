import { FileText, FolderOpen } from 'lucide-react'
import { Button, Card, ListBox } from '@heroui/react'
import ReactMarkdown from 'react-markdown'
import { useFiles } from '../hooks/useFiles'

export function ReaderPage(): React.JSX.Element {
  const { files, active, activeFile, openFile, setActive } = useFiles()

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl flex-col px-4 pb-6 pt-8 sm:px-6 lg:pt-10">
      <section className="mb-6">
        <p className="text-sm font-medium text-accent">Markdown workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reader</h1>
        <p className="mt-2 text-muted">
          Open project documentation and keep it alongside your work.
        </p>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <Card className="flex min-h-0 flex-col">
          <Card.Header className="p-5">
            <Card.Title>Open files</Card.Title>
          </Card.Header>
          <Card.Content className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-5">
            <Button variant="primary" className="w-full" onPress={openFile}>
              <FolderOpen size={16} aria-hidden="true" />
              Open Markdown
            </Button>
            {files.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <FileText size={22} className="text-muted" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted">No files opened yet.</p>
              </div>
            ) : (
              <ListBox
                aria-label="Opened files"
                selectionMode="single"
                selectedKeys={active ? new Set([active]) : undefined}
                onAction={(key) => setActive(String(key))}
                className="min-h-0 w-full flex-1 overflow-auto"
              >
                {files.map((file) => (
                  <ListBox.Item
                    key={file.path}
                    id={file.path}
                    textValue={file.name}
                    className="cursor-pointer"
                  >
                    <span className="truncate text-sm">{file.name}</span>
                  </ListBox.Item>
                ))}
              </ListBox>
            )}
          </Card.Content>
        </Card>

        <Card className="min-h-0 overflow-hidden">
          <Card.Header className="border-b border-separator p-5 sm:p-6">
            <Card.Title>{activeFile ? activeFile.name : 'Preview'}</Card.Title>
          </Card.Header>
          <Card.Content className="min-h-0 overflow-auto p-5 sm:p-8">
            {activeFile ? (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{activeFile.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                <FileText size={28} className="text-muted" aria-hidden="true" />
                <p className="mt-4 font-medium">Nothing to preview</p>
                <p className="mt-1 text-sm text-muted">Choose a Markdown file from the list.</p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </main>
  )
}
