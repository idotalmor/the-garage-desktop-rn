import { useCallback, useMemo, useState } from 'react'
import { ReaderChannel } from '../../../../../shared/reader/channels'
import type { ImportMode } from '../../../../../shared/reader/types'
import type { MdFile } from '../types/md-file'

export function useFiles(): {
  files: MdFile[]
  active: string | null
  activeFile: MdFile | null
  openFile: () => Promise<void>
  importFiles: (payload: {
    paths: string[]
    mode: ImportMode
    tag?: string
  }) => Promise<MdFile[] | undefined>
  setActive: (value: string | null) => void
  tags: string[]
} {
  const [files, setFiles] = useState<MdFile[]>([])
  const [active, setActive] = useState<string | null>(null)

  const activeFile = useMemo(
    () => files.find((file) => file.path === active) ?? null,
    [files, active]
  )

  const openFile = useCallback(async (): Promise<void> => {
    const file = (await window.electron.ipcRenderer.invoke(ReaderChannel.Open)) as MdFile | null
    if (!file) return
    setFiles((prev) => (prev.some((item) => item.path === file.path) ? prev : [...prev, file]))
    setActive(file.path)
  }, [])

  const importFiles = useCallback(
    async (payload: {
      paths: string[]
      mode: ImportMode
      tag?: string
    }): Promise<MdFile[] | undefined> => {
      const imported = (await window.electron.ipcRenderer.invoke(
        ReaderChannel.Import,
        payload
      )) as MdFile[]
      if (!imported.length) return

      setFiles((prev) => {
        const existing = new Set(prev.map((item) => item.path))
        const added = imported.filter((item) => !existing.has(item.path))
        return [...prev, ...added]
      })

      setActive((current) => current ?? imported[0].path)
      return imported
    },
    []
  )

  const tags = useMemo(
    () => Array.from(new Set(files.flatMap((file) => file.tags))).sort(),
    [files]
  )

  return {
    files,
    active,
    activeFile,
    openFile,
    importFiles,
    setActive,
    tags
  }
}
