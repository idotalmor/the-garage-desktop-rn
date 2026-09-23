export const WindowChannel = {
  Duplicate: 'windows:duplicate',
  List: 'windows:list',
  Focus: 'windows:focus',
  Promote: 'windows:promote-popover'
} as const

export type OpenWindow = {
  id: number
  title: string
  isFocused: boolean
}
