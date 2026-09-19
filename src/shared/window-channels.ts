export const WindowChannel = {
  Duplicate: 'windows:duplicate',
  List: 'windows:list',
  Focus: 'windows:focus'
} as const

export type OpenWindow = {
  id: number
  title: string
  isFocused: boolean
}
