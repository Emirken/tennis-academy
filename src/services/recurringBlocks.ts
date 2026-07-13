// Periyodik kort kapatma kuralları — Firestore CRUD katmanı.
// Koleksiyon: `recurringCourtBlocks` (kural başına bir doküman).
// Saf çözümleme mantığı utils/recurringCourtBlocks.ts'tedir; bu dosya yalnız
// okuma/yazma yapar. Kurallar materyalize EDİLMEZ: her görünüm okuma anında
// resolveRecurringBlocksForDate ile çözer (tek kaynak, silme temiz).

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { RecurringCourtBlock, RecurringBlockStatus } from '@/utils/recurringCourtBlocks'

const COLLECTION = 'recurringCourtBlocks'

export interface NewRecurringCourtBlock {
  dayOfWeek: number
  status: RecurringBlockStatus
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  /** HAM kort id'leri; boş dizi = tüm kortlar. */
  courtIds: string[]
  reason?: string
  createdBy?: string
}

/** Tüm kuralları getirir (en yeni önce). */
export async function fetchRecurringBlocks(): Promise<RecurringCourtBlock[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecurringCourtBlock, 'id'>) }))
}

/** Yeni kural ekler; eklenen dokümanın id'sini döner. */
export async function addRecurringBlock(block: NewRecurringCourtBlock): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...block,
    reason: block.reason || '',
    createdBy: block.createdBy || '',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** Kuralı siler — tüm görünümler okuma anında çözdüğünden anında etkilidir. */
export async function deleteRecurringBlock(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
