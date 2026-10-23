import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentSnapshot,
  type Timestamp
} from 'firebase/firestore'
import { getDb } from './client'

export type PreferenceType = 'THEME' | 'PREFERRED_IDE' | 'ACTIVE_TEAM'

export interface Preference {
  id: string
  userId: string
  type: PreferenceType
  data: Record<string, unknown>
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export function prefFromDoc(snapshot: DocumentSnapshot): Preference {
  return { id: snapshot.id, ...(snapshot.data() as Omit<Preference, 'id'>) }
}

export async function loadPreferences(userId: string): Promise<Preference[]> {
  const prefsQuery = query(collection(getDb(), 'preferences'), where('userId', '==', userId))
  const snapshot = await getDocs(prefsQuery)
  return snapshot.docs.map(prefFromDoc)
}

export async function upsertPreference(
  userId: string,
  type: PreferenceType,
  data: Record<string, unknown>
): Promise<void> {
  const ref = doc(getDb(), 'preferences', `${userId}_${type}`)
  await setDoc(
    ref,
    {
      userId,
      type,
      data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )
}
