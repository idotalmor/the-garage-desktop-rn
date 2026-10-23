import type { User } from 'firebase/auth'
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  type DocumentReference,
  type DocumentSnapshot,
  type Timestamp
} from 'firebase/firestore'
import { getDb } from './client'

export interface TeamMember {
  uid: string
  displayName: string | null
  photoURL: string | null
  role: 'admin' | 'member'
}

export interface Team {
  id: string
  name: string
  description?: string
  creatorId: string
  adminIds: string[]
  memberIds: string[]
  members: TeamMember[]
  repos: DocumentReference[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export function teamFromDoc(snapshot: DocumentSnapshot): Team {
  return { id: snapshot.id, ...(snapshot.data() as Omit<Team, 'id'>) }
}

export async function listMyTeams(userId: string): Promise<Team[]> {
  const teamsQuery = query(
    collection(getDb(), 'teams'),
    where('memberIds', 'array-contains', userId)
  )
  const snapshot = await getDocs(teamsQuery)
  return snapshot.docs.map(teamFromDoc)
}

export async function createTeam(
  { name, description }: { name: string; description?: string },
  creator: User
): Promise<Team> {
  const member: TeamMember = {
    uid: creator.uid,
    displayName: creator.displayName,
    photoURL: creator.photoURL,
    role: 'admin'
  }
  const ref = await addDoc(collection(getDb(), 'teams'), {
    name,
    description: description ?? null,
    creatorId: creator.uid,
    adminIds: [creator.uid],
    memberIds: [creator.uid],
    members: [member],
    repos: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return {
    id: ref.id,
    name,
    description,
    creatorId: creator.uid,
    adminIds: [creator.uid],
    memberIds: [creator.uid],
    members: [member],
    repos: []
  }
}
