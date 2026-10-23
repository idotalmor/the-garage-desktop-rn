import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  serverTimestamp,
  type DocumentReference,
  type DocumentSnapshot,
  type Timestamp
} from 'firebase/firestore'
import { getDb } from './client'

export interface Repository {
  id: string
  provider: 'github' | 'gitlab' | string
  externalId?: string
  name: string
  url: string
  slackChannels: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export function repoFromDoc(snapshot: DocumentSnapshot): Repository {
  return { id: snapshot.id, ...(snapshot.data() as Omit<Repository, 'id'>) }
}

export async function listRepositories(): Promise<Repository[]> {
  const snapshot = await getDocs(collection(getDb(), 'repositories'))
  return snapshot.docs.map(repoFromDoc)
}

export async function resolveRepos(refs: DocumentReference[]): Promise<Repository[]> {
  const snapshots = await Promise.all(refs.map((ref) => getDoc(ref)))
  return snapshots.filter((snapshot) => snapshot.exists()).map(repoFromDoc)
}

export async function createRepository(
  repo: Omit<Repository, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(getDb(), 'repositories'), {
    ...repo,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return ref.id
}
