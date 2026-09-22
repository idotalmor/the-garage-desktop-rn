import { useMemo, useState, type ReactNode } from 'react'
import {
  FeatureMenuApiContext,
  FeatureMenuContributionContext,
  useFeatureMenu,
  type FeatureMenuApi,
  type FeatureMenuContribution
} from './feature-menu-context'

export function FeatureMenuProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [contribution, setContribution] = useState<FeatureMenuContribution | null>(null)
  const [panelSlot, setPanelSlot] = useState<HTMLElement | null>(null)

  const api = useMemo<FeatureMenuApi>(
    () => ({ panelSlot, setPanelSlot, setContribution }),
    [panelSlot]
  )

  return (
    <FeatureMenuApiContext.Provider value={api}>
      <FeatureMenuContributionContext.Provider value={contribution}>
        {children}
      </FeatureMenuContributionContext.Provider>
    </FeatureMenuApiContext.Provider>
  )
}

export function FeatureMenuSlot({ className }: { className?: string }): React.JSX.Element {
  const api = useFeatureMenu()
  return <div ref={api?.setPanelSlot} className={className} />
}
