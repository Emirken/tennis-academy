// Admin'in bekleyen kort talebini onaylaması/reddetmesi ve bayat
// "Yeni Rezervasyon Talebi" bildirimlerinin temizlenmesi.
//
// 2026-10-08 canlı olayı: öğrenci 08:00'ı iptal edip 09:00'ı aldı; 08:00'ın
// reservation_pending bildirimi admin kuyruğunda kaldı ve "Onayla" iptal
// edilmiş kaydı confirmed yaptı → aynı güne iki kayıt. Sunucu tarafı
// karşılığı: firestore.rules isRentalReactivation.
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

export type PendingReviewResult = 'done' | 'stale'

/**
 * Talebi YALNIZ hâlâ 'pending' ise onaylar/reddeder; okuma ve yazma aynı
 * transaction'da. Talep iptal edilmiş, zaten karara bağlanmış ya da silinmişse
 * hiçbir şey yazmaz ve 'stale' döner (bildirim bayattır).
 */
export async function reviewPendingReservation(
  reservationId: string,
  decision: 'approve' | 'reject'
): Promise<PendingReviewResult> {
  const ref = doc(db, 'reservations', reservationId)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists() || snap.data()?.status !== 'pending') return 'stale'
    tx.update(ref, decision === 'approve'
      ? { status: 'confirmed' }
      : { status: 'cancelled', cancelledAt: serverTimestamp(), cancelledBy: 'admin' })
    return 'done'
  })
}

/**
 * İptal edilen taleplerin admin kuyruğundaki reservation_pending
 * bildirimlerini siler — iptal edilmiş talep için "Onayla" görünmesin.
 */
export async function deletePendingRequestNotifications(reservationIds: string[]): Promise<void> {
  await Promise.all(reservationIds.map(async (reservationId) => {
    const snap = await getDocs(query(
      collection(db, 'notifications'),
      where('type', '==', 'reservation_pending'),
      where('relatedData.reservationId', '==', reservationId)
    ))
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  }))
}
