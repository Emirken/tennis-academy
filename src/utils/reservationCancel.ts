// Admin'in bir rezervasyonu/dersi iptal ederken HANGİ Firestore dokümanlarını
// 'cancelled' yapması gerektiğini saf (yan etkisiz) olarak hesaplar.
//
// SORUN: Takvim (AdminCalendar) ve kort durumu (Courts.vue) bir GRUP dersini
// tek bir görsel öğe olarak gösterir; ama arkada o grup+tarih+saat+kort için
// birden fazla üye rezervasyon dokümanı olabilir (her üye bir doküman). Sadece
// tıklanan tek dokümanı iptal etmek slotu yarı dolu bırakır. Bu yüzden bir
// grup öğesi iptal edilince eşleşen TÜM dokümanlar iptal edilmelidir.
//
// ÇÖZÜM: AdminCalendar'ın grup tekilleştirme anahtarıyla (groupId + date +
// startTime + courtId) AYNI ölçütü kullanarak iptal edilecek doküman id'lerini
// topla. Bireysel (özel ders / kort kiralama) rezervasyonda yalnızca hedef
// dokümanın kendisi iptal edilir.

import {
  getReservationGroupId,
  isSlotBlockingReservation,
  normalizeReservationDate,
  type RawReservationDoc,
} from './dailyReservationLimit'

// Bir iptal hedefini tanımlayan kimlik. AdminCalendar'daki CalendarEvent ya da
// Courts.vue'daki slot bu alanlardan türetilir.
export interface CancelTarget {
  /** Tıklanan/seçilen rezervasyonun kendi doküman id'si. */
  reservationId: string
  /** Grup dersi ise grup id'si (groupId/groupAssignment); değilse boş/undefined. */
  groupId?: string | null
  /** Hedefin tarihi (string | Firestore Timestamp | Date). */
  date?: unknown
  /** Başlangıç saati ('HH:mm'). */
  startTime?: string
  /** Kort id'si (ham Firestore değeri; karşılaştırma normalize ile yapılır). */
  courtId?: string
}

// reservations koleksiyonundan gelen ham doküman + zorunlu id.
export interface RawReservationDocWithId extends RawReservationDoc {
  id: string
}

// İki kort id'sini, AdminCalendar/Courts'taki normalize mantığına bağımlı
// olmadan karşılaştırır: küçük harfe indirger ve ayraçları ('-', '_', boşluk)
// temizler. Böylece 'court-1', 'Court_1', 'K1' gibi farklı yazımlar yerine
// salt kıyaslama yapılır. Tam normalize gerekirse çağıran taraf önceden
// dönüştürebilir; burada amaç aynı slotu işaret eden kayıtları eşlemektir.
function sameCourt(a: string | undefined, b: string | undefined): boolean {
  if (a == null || b == null) return false
  const norm = (s: string) => s.toLowerCase().replace(/[-_\s]/g, '')
  return norm(a) === norm(b)
}

/**
 * İptal edilmesi gereken rezervasyon doküman id'lerini döndürür.
 *
 * - Grup dersi (target.groupId dolu): aynı grup + tarih + başlangıç saati +
 *   kort'a ait, hâlâ slotu meşgul eden (pending/confirmed/active/status'suz)
 *   TÜM dokümanlar. Hedef dokümanın kendisi de daima dahildir.
 * - Bireysel rezervasyon: yalnızca target.reservationId.
 *
 * Zaten iptal/tamamlanmış (slotu meşgul etmeyen) eş dokümanlar tekrar iptal
 * edilmez; ama hedef dokümanın kendisi her durumda listeye girer (admin onu
 * açıkça iptal etmek istiyor).
 *
 * Dönüş sırası deterministiktir: önce hedef id, sonra kalan eşleşmeler
 * `allReservations` sırasına göre.
 */
export function getReservationIdsToCancel(
  target: CancelTarget,
  allReservations: RawReservationDocWithId[],
): string[] {
  const ids: string[] = []
  const seen = new Set<string>()

  const add = (id: string | undefined) => {
    if (!id || seen.has(id)) return
    seen.add(id)
    ids.push(id)
  }

  // Hedef doküman daima iptal edilir.
  add(target.reservationId)

  const groupId = target.groupId
  if (!groupId) {
    // Bireysel rezervasyon: yalnızca hedef.
    return ids
  }

  // Grup dersi: eşleşen tüm üye dokümanlarını topla.
  const targetDate = normalizeReservationDate(target.date)

  for (const res of allReservations) {
    if (res.id === target.reservationId) continue
    // Yalnızca slotu meşgul eden kayıtları iptal et (zaten iptal/tamamlanmışı atla).
    if (!isSlotBlockingReservation(res)) continue
    if (getReservationGroupId(res) !== groupId) continue
    if (targetDate !== null && normalizeReservationDate(res.date) !== targetDate) continue
    if (target.startTime != null && res.startTime !== target.startTime) continue
    if (target.courtId != null && !sameCourt(res.courtId as string, target.courtId)) continue
    add(res.id)
  }

  return ids
}
