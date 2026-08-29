import { useState } from 'react'
import { Button, Card, ListBox } from '@heroui/react'
import { marked } from 'marked'
import { ReaderChannel } from '../../../shared/reader/channels'

type MdFile = {
  path: string
  name: string
  content: string
}

function useFiles() {
  const [files, setFiles] = useState<MdFile[]>([])
  const [active, setActive] = useState<string | null>(null)

  const openFile = async (): Promise<void> => {
    const file = (await window.electron.ipcRenderer.invoke(ReaderChannel.Open)) as MdFile | null
    if (!file) return
    setFiles((prev) => {
      if (prev.some((f) => f.path === file.path)) return prev
      return [...prev, file]
    })
    setActive(file.path)
  }

  const activeFile = files.find((f) => f.path === active) ?? null

  return { files, active, activeFile, openFile, setActive }
}

export function Reader(): React.JSX.Element {
  const { files, active, activeFile, openFile, setActive } = useFiles()

  return (
    <main className="h-[calc(100vh-4rem)] p-4 sm:p-6">
      <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <Card className="flex h-full flex-col overflow-hidden">
          <Card.Header>
            <Card.Title>Files</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-1 flex-col gap-3 overflow-hidden">
            <Button variant="primary" className="w-full" onPress={() => openFile()}>
              Open .md
            </Button>
            {files.length === 0 ? (
              <p className="text-sm text-muted">No files opened yet.</p>
            ) : (
              <ListBox
                aria-label="Opened files"
                selectionMode="single"
                selectedKeys={active ? new Set([active]) : undefined}
                onAction={(key) => setActive(String(key))}
                className="w-full flex-1 overflow-auto"
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

        <Card className="h-full overflow-hidden">
          <Card.Header>
            <Card.Title>{activeFile ? activeFile.name : 'Preview'}</Card.Title>
          </Card.Header>
          <Card.Content className="h-full overflow-auto">
            {activeFile ? (
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: marked(activeFile.content) }}
              />
            ) : (
              <p className="text-muted">Open a Markdown file to preview it.</p>
            )}
          </Card.Content>
        </Card>
      </div>
    </main>
  )
}
