import { useMemo } from 'react'
import type { MdFile } from '../../../../../../../shared/artifactory/types'

type SplitState = {
  left: string
  right: string
}

export type ArtifactoryTab = {
  id: string
  files: MdFile[]
  isCombined: boolean
  isVisible: boolean
}

type UseArtifactoryTabsArgs = {
  openFiles: MdFile[]
  split: SplitState | null
  active: string | null
  pinnedPaths: string[]
}

export function useArtifactoryTabs({
  openFiles,
  split,
  active,
  pinnedPaths
}: UseArtifactoryTabsArgs): {
  tabs: ArtifactoryTab[]
  visibleTabs: ArtifactoryTab[]
  activeTab: ArtifactoryTab | null
} {
  return useMemo(() => {
    const splitPaths = split ? new Set([split.left, split.right]) : new Set<string>()
    const orderedFiles = [...openFiles].sort(
      (a, b) => Number(pinnedPaths.includes(b.path)) - Number(pinnedPaths.includes(a.path))
    )
    const splitFiles = orderedFiles.filter((file) => splitPaths.has(file.path))
    const regularFiles = orderedFiles.filter((file) => !splitPaths.has(file.path))
    const splitTab: ArtifactoryTab | null = splitFiles.length
      ? {
          id: `split:${splitFiles.map((file) => file.path).join('|')}`,
          files: splitFiles,
          isCombined: splitFiles.length > 1,
          isVisible: splitFiles.length > 1
        }
      : null
    const regularTabs = regularFiles.map<ArtifactoryTab>((file) => ({
      id: file.path,
      files: [file],
      isCombined: false,
      isVisible: true
    }))
    const tabs = splitTab ? [...regularTabs, splitTab] : regularTabs
    const activeTab = tabs.find((tab) => tab.files.some((file) => file.path === active)) ?? null

    return {
      tabs,
      visibleTabs: tabs.filter((tab) => tab.isVisible),
      activeTab
    }
  }, [active, openFiles, pinnedPaths, split])
}
