export const AppStateChannel = {
  Get: 'app-state:get',
  Patch: 'app-state:patch',
  Changed: 'app-state:changed'
} as const

export type AppStateChange = {
  name: string
  value: unknown
}
