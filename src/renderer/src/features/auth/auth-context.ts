import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { Preference } from '../firestore/preferences'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

export type AuthContextValue = {
  user: User | null
  status: AuthStatus
  isConfigured: boolean
  signingIn: boolean
  error: string | null
  preferences: Preference[]
  signIn: () => Promise<void>
  logOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
