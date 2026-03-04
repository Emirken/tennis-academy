// src/services/membershipTypes.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { MembershipType } from '@/types/membershipType'
import { DEFAULT_MEMBERSHIP_TYPES } from '@/types/membershipType'

const COLLECTION_NAME = 'membershipTypes'

/**
 * Get all membership types
 */
export async function getAllMembershipTypes(): Promise<MembershipType[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as MembershipType))
}

/**
 * Get only active membership types
 */
export async function getActiveMembershipTypes(): Promise<MembershipType[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('isActive', '==', true),
    orderBy('order', 'asc')
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as MembershipType))
}

/**
 * Get membership type by ID
 */
export async function getMembershipTypeById(id: string): Promise<MembershipType | null> {
  const docRef = doc(db, COLLECTION_NAME, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  return {
    id: docSnap.id,
    ...docSnap.data()
  } as MembershipType
}

/**
 * Get membership type by key
 */
export async function getMembershipTypeByKey(key: string): Promise<MembershipType | null> {
  const q = query(collection(db, COLLECTION_NAME), where('key', '==', key))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data()
  } as MembershipType
}

/**
 * Create a new membership type
 */
export async function createMembershipType(
  data: Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Check if key already exists
  const existing = await getMembershipTypeByKey(data.key)
  if (existing) {
    throw new Error(`'${data.key}' anahtarı zaten kullanılıyor`)
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  return docRef.id
}

/**
 * Update an existing membership type
 */
export async function updateMembershipType(
  id: string,
  data: Partial<Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  // If key is being changed, check if new key already exists
  if (data.key) {
    const existing = await getMembershipTypeByKey(data.key)
    if (existing && existing.id !== id) {
      throw new Error(`'${data.key}' anahtarı zaten kullanılıyor`)
    }
  }

  const docRef = doc(db, COLLECTION_NAME, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

/**
 * Delete a membership type
 */
export async function deleteMembershipType(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id)
  await deleteDoc(docRef)
}

/**
 * Toggle membership type active status
 */
export async function toggleMembershipTypeActive(id: string, isActive: boolean): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id)
  await updateDoc(docRef, {
    isActive,
    updatedAt: serverTimestamp()
  })
}

/**
 * Reorder membership types
 */
export async function reorderMembershipTypes(orderedIds: string[]): Promise<void> {
  const updatePromises = orderedIds.map((id, index) => {
    const docRef = doc(db, COLLECTION_NAME, id)
    return updateDoc(docRef, {
      order: index + 1,
      updatedAt: serverTimestamp()
    })
  })

  await Promise.all(updatePromises)
}

/**
 * Subscribe to membership types changes (real-time)
 */
export function subscribeMembershipTypes(
  callback: (types: MembershipType[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'))

  return onSnapshot(q, (snapshot) => {
    const types = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MembershipType))

    callback(types)
  })
}

/**
 * Seed initial membership types if collection is empty
 */
export async function seedMembershipTypes(): Promise<boolean> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME))
  const existingKeys = new Set(snapshot.docs.map(doc => doc.data().key))

  let addedCount = 0
  for (const type of DEFAULT_MEMBERSHIP_TYPES) {
    if (!existingKeys.has(type.key)) {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...type,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      addedCount++
    }
  }

  if (addedCount > 0) {
    console.log(`✅ ${addedCount} eksik varsayılan üyelik türleri eklendi`)
    return true
  } else {
    console.log('ℹ️ Tüm varsayılan üyelik türleri zaten mevcut')
    return false
  }
}

/**
 * Get membership type display info (name and color) by key
 * Returns defaults if not found
 */
export function getMembershipDisplayInfo(
  types: MembershipType[],
  key: string
): { name: string; color: string } {
  const type = types.find(t => t.key === key)
  return {
    name: type?.name || key,
    color: type?.color || 'grey'
  }
}

/**
 * Check if a membership type is a group type
 */
export function isGroupMembershipType(types: MembershipType[], key: string): boolean {
  const type = types.find(t => t.key === key)
  return type?.isGroupType || false
}

/**
 * Get max capacity for a group membership type
 */
export function getGroupMaxCapacity(types: MembershipType[], key: string): number {
  const type = types.find(t => t.key === key)
  return type?.maxCapacity || 8
}

/**
 * Convert membership types to select options format
 */
export function toSelectOptions(types: MembershipType[]): { title: string; value: string }[] {
  return types
    .filter(t => t.isActive)
    .map(t => ({
      title: t.name,
      value: t.key
    }))
}

/**
 * Convert membership types to lookup map
 */
export function toLookupMap(types: MembershipType[]): Record<string, MembershipType> {
  return types.reduce((acc, type) => {
    acc[type.key] = type
    return acc
  }, {} as Record<string, MembershipType>)
}
