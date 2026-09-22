import { createContext, useContext } from 'react'

export type FeatureMenuContribution = {
  isOpen: boolean
  onToggle: () => void
  label: string
}

export type FeatureMenuApi = {
  panelSlot: HTMLElement | null
  setPanelSlot: (element: HTMLElement | null) => void
  setContribution: (contribution: FeatureMenuContribution | null) => void
}

export const FeatureMenuApiContext = createContext<FeatureMenuApi | null>(null)
export const FeatureMenuContributionContext = createContext<FeatureMenuContribution | null>(null)

export function useFeatureMenu(): FeatureMenuApi | null {
  return useContext(FeatureMenuApiContext)
}

export function useFeatureMenuContribution(): FeatureMenuContribution | null {
  return useContext(FeatureMenuContributionContext)
}
