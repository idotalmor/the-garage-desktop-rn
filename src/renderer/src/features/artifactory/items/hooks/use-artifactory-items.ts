import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArtifactoryChannel } from '../../../../../../shared/artifactory/channels'
import type { ImportMode, MdFile, Tag } from '../../../../../../shared/artifactory/types'

export function useArtifactoryItems(): {
  files: MdFile[]
  openFiles: MdFile[]
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
  openPath: (path: string) => void
  setActive: (value: string | null) => void
  setFileTags: (path: string, tags: Tag[]) => Promise<void>
  tags: Tag[]
} {
  const [files, setFiles] = useState<MdFile[]>([])
  const [openPaths, setOpenPaths] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)

  const openFiles = useMemo(
    () =>
      openPaths.map((path) => files.find((file) => file.path === path)).filter(Boolean) as MdFile[],
    [files, openPaths]
  )

  const activeFile = useMemo(
    () => files.find((file) => file.path === active) ?? null,
    [files, active]
  )

  useEffect(() => {
    let cancelled = false
    void window.electron.ipcRenderer.invoke(ArtifactoryChannel.List).then((loaded) => {
      if (cancelled) return
      const stored = loaded as MdFile[]
      setFiles(stored)
      setOpenPaths(stored.map((file) => file.path))
      setActive(stored[0]?.path ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const openFile = useCallback(async (): Promise<void> => {
    const file = (await window.electron.ipcRenderer.invoke(
      ArtifactoryChannel.Open
    )) as MdFile | null
    if (!file) return
    setFiles((prev) => (prev.some((item) => item.path === file.path) ? prev : [...prev, file]))
    setOpenPaths((prev) => (prev.includes(file.path) ? prev : [...prev, file.path]))
    setActive(file.path)
  }, [])

  const importFiles = useCallback(
    async (payload: {
      paths: string[]
      mode: ImportMode
      tag?: Tag
    }): Promise<MdFile[] | undefined> => {
      const imported = (await window.electron.ipcRenderer.invoke(
        ArtifactoryChannel.Import,
        payload
      )) as MdFile[]
      if (!imported.length) return

      setFiles((prev) => {
        const existing = new Set(prev.map((item) => item.path))
        const added = imported.filter((item) => !existing.has(item.path))
        return [...prev, ...added]
      })

      setOpenPaths((current) => [
        ...current,
        ...imported.map((file) => file.path).filter((path) => !current.includes(path))
      ])
      setActive((current) => current ?? imported[0].path)
      return imported
    },
    []
  )

  const saveFile = useCallback(async (file: MdFile, content: string): Promise<void> => {
    await window.electron.ipcRenderer.invoke(ArtifactoryChannel.Save, {
      path: file.path,
      content
    })
    setFiles((prev) => prev.map((item) => (item.path === file.path ? { ...item, content } : item)))
  }, [])

  const closeFile = useCallback(
    (path: string): void => {
      setOpenPaths((current) => {
        const next = current.filter((item) => item !== path)
        if (active === path) setActive(next[next.length - 1] ?? null)
        return next
      })
    },
    [active]
  )

  const openPath = useCallback((path: string): void => {
    setOpenPaths((current) => (current.includes(path) ? current : [...current, path]))
    setActive(path)
  }, [])

  const setFileTags = useCallback(async (path: string, nextTags: Tag[]): Promise<void> => {
    await window.electron.ipcRenderer.invoke(ArtifactoryChannel.SetFileTags, {
      path,
      tags: nextTags
    })
    setFiles((prev) =>
      prev.map((item) => (item.path === path ? { ...item, tags: nextTags } : item))
    )
  }, [])

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
    openFiles,
    active,
    activeFile,
    openFile,
    importFiles,
    saveFile,
    closeFile,
    openPath,
    setActive,
    setFileTags,
    tags
  }
}
