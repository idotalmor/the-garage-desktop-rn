import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

export type AuthContextValue = {
  user: User | null
  status: AuthStatus
  isConfigured: boolean
  signingIn: boolean
  error: string | null
  signIn: () => Promise<void>
  logOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
