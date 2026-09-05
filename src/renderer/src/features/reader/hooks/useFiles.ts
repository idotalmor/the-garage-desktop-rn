import { useState } from 'react'
import { ReaderChannel } from '../../../../../shared/reader/channels'
import type { MdFile } from '../types/md-file'

export function useFiles(): {
  files: MdFile[]
  active: string | null
  activeFile: MdFile | null
  openFile: () => Promise<void>
  setActive: (value: string | null) => void
} {
  const [files, setFiles] = useState<MdFile[]>([])
  const [active, setActive] = useState<string | null>(null)

  const openFile = async (): Promise<void> => {
    const file = (await window.electron.ipcRenderer.invoke(ReaderChannel.Open)) as MdFile | null
    if (!file) return
    setFiles((prev) => (prev.some((item) => item.path === file.path) ? prev : [...prev, file]))
    setActive(file.path)
  }

  return {
    files,
    active,
    activeFile: files.find((file) => file.path === active) ?? null,
    openFile,
    setActive
  }
}
