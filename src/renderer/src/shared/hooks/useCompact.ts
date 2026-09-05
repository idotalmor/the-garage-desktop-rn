import { useEffect, useState } from 'react'

export function useCompact(): boolean {
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 768px)').matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const onChange = (event: MediaQueryListEvent): void => setIsCompact(event.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return isCompact
}
