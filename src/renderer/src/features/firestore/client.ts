import { getFirestore, type Firestore } from 'firebase/firestore'
import { getFirebaseAuth } from '../auth/firebase'

let db: Firestore | null = null

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseAuth().app)
  }
  return db
}
