// Kort kiralamasını günün kilidiyle birlikte yazan Firestore yardımcıları.
// Kilit mantığı ve gerekçesi: utils/reservationDayLock.ts, kurallar:
// firestore.rules (reservations + reservationDayLocks).
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore'
import { db } from './firebase'
import type { RawReservationDoc } from '@/utils/dailyReservationLimit'
import {
  DAY_LOCKS_COLLECTION,
  dayLockId,
  isDayLockHeld,
  isValidDateKey,
} from '@/utils/reservationDayLock'

interface CourtRentalCommit {
  studentId: string
  dateKey: string
  reservation: Record<string, unknown>
}

function dayLockData(studentId: string, dateKey: string, reservationId: string) {
  return { studentId, dateKey, reservationId, updatedAt: serverTimestamp() }
}

/**
 * Öğrencinin kort kiralamasını ve o günün kilidini TEK batch'te yazar.
 * Aynı gün başka aktif kiralaması varsa kural batch'i reddeder
 * (permission-denied) ve hiçbir şey yazılmaz. Yeni rezervasyonun id'sini döner.
 */
export async function commitStudentCourtRental({
  studentId,
  dateKey,
  reservation,
}: CourtRentalCommit): Promise<string> {
  const lockRef = doc(db, DAY_LOCKS_COLLECTION, dayLockId(studentId, dateKey))
  const reservationRef = doc(collection(db, 'reservations'))

  const batch = writeBatch(db)
  batch.set(reservationRef, reservation)
  batch.set(lockRef, dayLockData(studentId, dateKey, reservationRef.id))
  await batch.commit()

  return reservationRef.id
}

/**
 * Admin'in (kayıtlı öğrenci adına ya da misafir için) açtığı kort kiralaması.
 * Admin günde-bir kuralından muaftır ama öğrencinin kilidi BOŞSA alınır —
 * aksi hâlde öğrenci, admin'in açtığı güne kuralı atlatarak ikinci kayıt
 * ekleyebilirdi. Kilit başka aktif bir kaydı gösteriyorsa (admin bilinçli
 * ikinci kayıt açıyor) kilide dokunulmaz.
 */
export async function commitAdminCourtRental({
  studentId,
  dateKey,
  reservation,
}: Omit<CourtRentalCommit, 'studentId'> & { studentId: string | null }): Promise<string> {
  const reservationRef = doc(collection(db, 'reservations'))

  const batch = writeBatch(db)
  batch.set(reservationRef, reservation)
  // Misafir kaydında (studentId yok) kilit yok; tarih anahtarı bozuksa admin
  // kaydı engellenmez, yalnız kilit atlanır.
  if (studentId && isValidDateKey(dateKey)) {
    const lockRef = doc(db, DAY_LOCKS_COLLECTION, dayLockId(studentId, dateKey))
    if (!(await isLockHeld(lockRef))) {
      batch.set(lockRef, dayLockData(studentId, dateKey, reservationRef.id))
    }
  }
  await batch.commit()

  return reservationRef.id
}

async function isLockHeld(lockRef: DocumentReference): Promise<boolean> {
  const lockSnap = await getDoc(lockRef)
  if (!lockSnap.exists()) return false

  const reservationId = lockSnap.data()?.reservationId
  if (typeof reservationId !== 'string' || !reservationId) return false

  const pointee = await getDoc(doc(db, 'reservations', reservationId))
  return isDayLockHeld(pointee.exists() ? (pointee.data() as RawReservationDoc) : null)
}
