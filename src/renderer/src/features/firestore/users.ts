import type { User } from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentSnapshot,
  type Timestamp
} from 'firebase/firestore'
import { getDb } from './client'

export interface ProviderSnapshot {
  providerId: string
  uid: string | null
  email: string | null
  displayName: string | null
  photoURL: string | null
  phoneNumber: string | null
}

export interface FirebaseSnapshot {
  emailVerified: boolean
  isAnonymous: boolean
  tenantId: string | null
  authCreatedAt: string | null
  providers: ProviderSnapshot[]
}

export interface AppUser {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  firebase: FirebaseSnapshot
  createdAt?: Timestamp
  updatedAt?: Timestamp
  lastSignInAt?: Timestamp
}

export function userFromDoc(snapshot: DocumentSnapshot): AppUser {
  return { id: snapshot.id, ...(snapshot.data() as Omit<AppUser, 'id'>) }
}

function firebaseSnapshot(user: User): FirebaseSnapshot {
  return {
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    tenantId: user.tenantId,
    authCreatedAt: user.metadata.creationTime ?? null,
    providers: user.providerData.map((provider) => ({
      providerId: provider.providerId,
      uid: provider.uid,
      email: provider.email,
      displayName: provider.displayName,
      photoURL: provider.photoURL,
      phoneNumber: provider.phoneNumber
    }))
  }
}

export async function upsertUser(user: User): Promise<void> {
  const ref = doc(getDb(), 'users', user.uid)
  const snapshot = await getDoc(ref)
  const firebase = firebaseSnapshot(user)

  if (snapshot.exists()) {
    await setDoc(
      ref,
      {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        firebase,
        updatedAt: serverTimestamp(),
        lastSignInAt: serverTimestamp()
      },
      { merge: true }
    )
    return
  }

  await setDoc(ref, {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    firebase,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastSignInAt: serverTimestamp()
  })
}
