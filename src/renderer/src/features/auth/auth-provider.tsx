import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  type User
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from './firebase'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(configured ? 'loading' : 'signed-out')
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!configured) return
    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser)
      setStatus(nextUser ? 'signed-in' : 'signed-out')
    })
  }, [configured])

  const signIn = useCallback(async (): Promise<void> => {
    setSigningIn(true)
    setError(null)
    try {
      const credential = await window.api.auth.signInWithGoogle()
      if (credential) {
        await signInWithCredential(
          getFirebaseAuth(),
          GoogleAuthProvider.credential(credential.idToken, credential.accessToken)
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setSigningIn(false)
    }
  }, [])

  const logOut = useCallback(async (): Promise<void> => {
    await signOut(getFirebaseAuth())
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isConfigured: configured, signingIn, error, signIn, logOut }),
    [user, status, configured, signingIn, error, signIn, logOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
