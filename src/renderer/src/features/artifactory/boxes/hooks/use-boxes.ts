import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArtifactoryChannel } from '../../../../../../shared/artifactory/channels'
import type { ArtifactoryBox, MdFile, Tag } from '../../../../../../shared/artifactory/types'

export type ArtifactoryBoxView = ArtifactoryBox & {
  files: MdFile[]
}

type CreateBoxInput = {
  name: string
  color: string
  ticketKey?: string
}

export function useBoxes(
  files: MdFile[],
  setFileTags: (path: string, tags: Tag[]) => Promise<void>
): {
  boxes: ArtifactoryBoxView[]
  createBox: (input: CreateBoxInput) => Promise<void>
  deleteBox: (name: string) => Promise<void>
  addFileToBox: (path: string, box: ArtifactoryBoxView) => Promise<void>
  removeFileFromBox: (path: string, boxName: string) => Promise<void>
} {
  const [registry, setRegistry] = useState<ArtifactoryBox[]>([])

  useEffect(() => {
    let cancelled = false
    void window.electron.ipcRenderer.invoke(ArtifactoryChannel.ListBoxes).then((loaded) => {
      if (!cancelled) setRegistry(loaded as ArtifactoryBox[])
    })
    return () => {
      cancelled = true
    }
  }, [])

  const boxes = useMemo<ArtifactoryBoxView[]>(() => {
    const byName = new Map<string, ArtifactoryBoxView>()
    for (const box of registry) {
      byName.set(box.name, { ...box, files: [] })
    }
    for (const file of files) {
      for (const tag of file.tags) {
        const box =
          byName.get(tag.name) ??
          ({
            name: tag.name,
            color: tag.color,
            createdAt: 0,
            files: []
          } satisfies ArtifactoryBoxView)
        if (!byName.has(tag.name)) byName.set(tag.name, box)
        box.files.push(file)
      }
    }
    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [files, registry])

  const createBox = useCallback(async (input: CreateBoxInput): Promise<void> => {
    const name = input.name.trim()
    if (!name) return
    const box: ArtifactoryBox = {
      name,
      color: input.color,
      ticketKey: input.ticketKey?.trim() || undefined,
      createdAt: Date.now()
    }
    await window.electron.ipcRenderer.invoke(ArtifactoryChannel.SaveBox, box)
    setRegistry((current) => [...current.filter((item) => item.name !== name), box])
  }, [])

  const deleteBox = useCallback(
    async (name: string): Promise<void> => {
      await window.electron.ipcRenderer.invoke(ArtifactoryChannel.DeleteBox, name)
      setRegistry((current) => current.filter((item) => item.name !== name))
      await Promise.all(
        files
          .filter((file) => file.tags.some((tag) => tag.name === name))
          .map((file) =>
            setFileTags(
              file.path,
              file.tags.filter((tag) => tag.name !== name)
            )
          )
      )
    },
    [files, setFileTags]
  )

  const addFileToBox = useCallback(
    async (path: string, box: ArtifactoryBoxView): Promise<void> => {
      const file = files.find((item) => item.path === path)
      if (!file || file.tags.some((tag) => tag.name === box.name)) return
      const boxTag: Tag = { name: box.name, color: box.color }
      await setFileTags(path, [...file.tags.filter((tag) => tag.name !== box.name), boxTag])
    },
    [files, setFileTags]
  )

  const removeFileFromBox = useCallback(
    async (path: string, boxName: string): Promise<void> => {
      const file = files.find((item) => item.path === path)
      if (!file) return
      await setFileTags(
        path,
        file.tags.filter((tag) => tag.name !== boxName)
      )
    },
    [files, setFileTags]
  )

  return { boxes, createBox, deleteBox, addFileToBox, removeFileFromBox }
}
