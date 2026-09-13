import { useCallback, useMemo, useState } from 'react'
import { ReaderChannel } from '../../../../../shared/reader/channels'
import type { ImportMode, MdFile, Tag } from '../../../../../shared/reader/types'

export function useFiles(): {
  files: MdFile[]
  active: string | null
  activeFile: MdFile | null
  openFile: () => Promise<void>
  importFiles: (payload: {
    paths: string[]
    mode: ImportMode
    tag?: Tag
  }) => Promise<MdFile[] | undefined>
  saveFile: (file: MdFile, content: string) => Promise<void>
  closeFile: (path: string) => void
  setActive: (value: string | null) => void
  tags: Tag[]
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
      tag?: Tag
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

  const saveFile = useCallback(async (file: MdFile, content: string): Promise<void> => {
    await window.electron.ipcRenderer.invoke(ReaderChannel.Save, {
      path: file.path,
      content
    })
    setFiles((prev) => prev.map((item) => (item.path === file.path ? { ...item, content } : item)))
  }, [])

  const closeFile = useCallback(
    (path: string): void => {
      setFiles((prev) => {
        const next = prev.filter((item) => item.path !== path)
        if (active === path) {
          setActive(next[0]?.path ?? null)
        }
        return next
      })
    },
    [active]
  )

  const tags = useMemo(() => {
    const registry = new Map<string, Tag>()
    for (const file of files) {
      for (const tag of file.tags) {
        registry.set(tag.name, tag)
      }
    }
    return Array.from(registry.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [files])

  return {
    files,
    active,
    activeFile,
    openFile,
    importFiles,
    saveFile,
    closeFile,
    setActive,
    tags
  }
}
