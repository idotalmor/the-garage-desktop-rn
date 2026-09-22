import { useMemo } from 'react'
import type { MdFile } from '../../../../../../../shared/artifactory/types'

type SidebarGroupBy = 'folder' | 'tag'

type SidebarGroup = {
  name: string
  files: MdFile[]
}

function getFolderName(path: string): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length < 2) return 'Workspace'
  return parts[parts.length - 2]
}

export function useSidebarGroups(
  files: MdFile[],
  filterTag: string,
  groupBy: SidebarGroupBy
): SidebarGroup[] {
  return useMemo(() => {
    const filteredFiles =
      filterTag === 'all'
        ? files
        : files.filter((file) => file.tags.some((tag) => tag.name === filterTag))
    const groups = new Map<string, MdFile[]>()

    if (groupBy === 'folder') {
      filteredFiles.forEach((file) => {
        const folder = getFolderName(file.path)
        groups.set(folder, [...(groups.get(folder) ?? []), file])
      })
    } else {
      filteredFiles.forEach((file) => {
        if (file.tags.length === 0) {
          groups.set('Untagged', [...(groups.get('Untagged') ?? []), file])
          return
        }
        file.tags.forEach((tag) => groups.set(tag.name, [...(groups.get(tag.name) ?? []), file]))
      })
    }

    const sorted = [...groups.keys()].sort((a, b) => {
      if (a === 'Untagged') return 1
      if (b === 'Untagged') return -1
      return a.localeCompare(b)
    })

    return sorted.map((name) => ({ name, files: groups.get(name) ?? [] }))
  }, [files, filterTag, groupBy])
}
