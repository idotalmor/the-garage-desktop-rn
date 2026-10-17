import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.RENDERER_VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.RENDERER_VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.RENDERER_VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.RENDERER_VITE_FIREBASE_APP_ID as string | undefined
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.appId)
}

let app: FirebaseApp | null = null
let auth: Auth | null = null

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured (missing RENDERER_VITE_FIREBASE_* env vars)')
  }
  if (!auth) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
  }
  return auth
}
