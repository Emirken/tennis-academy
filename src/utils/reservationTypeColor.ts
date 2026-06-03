// Takvim renklendirmesi için rezervasyon TÜR sınıflandırması (TEK kaynak).
//
// Renkler artık KORT'a göre değil, rezervasyonun TÜRÜNE göre verilir; böylece
// admin ve öğrenci takvimleri aynı paleti paylaşır:
//   - Grup dersi  (group lesson)        → TURUNCU
//   - Özel ders   (private lesson)      → YEŞİL
//   - Rezervasyon (kort kiralama vb.)   → MOR
//
// ÖNEMLİ TUZAK: groupScheduleSync, HAFTALIK programdan oluşturulan TÜM dersleri
// (1 ve 2 kişilik ÖZEL paketler dahil) `reservationType: 'group-lesson'` +
// groupId/groupAssignment/groupSchedule ile damgalar. Yani bu alanlar bir dersin
// gerçekten "grup" olduğunu KANITLAMAZ. Grup mu özel mi ayrımının doğru kaynağı
// MEMBERSHIP TÜRÜDÜR (membershipType): isGroupType=true ise grup, değilse özel.
// Bu yüzden membershipType bilindiğinde grup/groupId heuristiğini EZER.

import { isLessonDoc, type RawReservationDoc } from './dailyReservationLimit'

export type ReservationKind = 'group-lesson' | 'private-lesson' | 'reservation'

// Tür paleti (admin + öğrenci takvimi ortak).
export const RESERVATION_TYPE_COLORS: Record<ReservationKind, string> = {
  'group-lesson': '#E65100', // turuncu
  'private-lesson': '#388E3C', // yeşil
  reservation: '#7B1FA2', // mor
}

// membershipType bir GRUP üyeliği mi belirten resolver (opsiyonel). Genelde
// membership store'un isGroupType'ı geçilir; geçilmezse statik fallback kullanılır.
export type IsGroupMembership = (membershipType: string) => boolean

// Statik fallback: store hazır olmadığında / pure çağrılarda membershipType
// anahtarından grup mu özel mi olduğunu çıkarır. DEFAULT_MEMBERSHIP_TYPES ile
// uyumludur (membershipType.ts):
//   GRUP   : private_group_*, adult_group, tennis_school_*
//   ÖZEL   : private_1_*, private_2_*, private_package_*, basic/premium/vip ...
//   KORT   : court_rental_* (ders değil → rezervasyon)
function staticIsGroupMembership(key: string): boolean {
  const k = key.toLowerCase()
  if (k.includes('_group_') || k.endsWith('_group')) return true // private_group_3_8, adult_group
  if (k.startsWith('tennis_school')) return true
  return false
}

// membershipType'ın bir DERS üyeliği olup olmadığı (kort kiralama değil).
function isLessonMembership(key: string): boolean {
  const k = key.toLowerCase()
  if (k.startsWith('court_rental')) return false
  return (
    k.startsWith('private_') ||
    k.startsWith('adult_group') ||
    k.startsWith('tennis_school')
  )
}

// Tür string'ini normalize eder: alt çizgiyi tireye çevirip küçük harfe alır.
// Böylece 'group_lesson'/'group-lesson' ve 'private_lesson'/'private-lesson'
// gibi varyantlar aynı kabul edilir (AdminCalendar tireli ve alt çizgili
// değerlerin ikisini de kullanır).
function normalizeType(v: unknown): string {
  return typeof v === 'string' ? v.toLowerCase().replace(/_/g, '-') : ''
}

// reservationType/type/group alanlarından "grup" işareti (membershipType YOKKEN
// son çare olarak kullanılır; varlığında membership kararı önceliklidir).
function hasGroupMarkers(doc: RawReservationDoc): boolean {
  if (normalizeType(doc.reservationType) === 'group-lesson') return true
  if (normalizeType(doc.type) === 'group-lesson') return true
  if (doc.groupSchedule === true) return true
  if (!!doc.groupId) return true
  if (!!doc.groupAssignment) return true
  return false
}

// Doküman özel ders mi (reservationType/type bazlı; membershipType'tan bağımsız).
function hasLessonMarkers(doc: RawReservationDoc): boolean {
  if (isLessonDoc(doc)) return true
  return (
    normalizeType(doc.reservationType) === 'private-lesson' ||
    normalizeType(doc.type) === 'private-lesson'
  )
}

/**
 * Bir rezervasyon dokümanını (ya da occupied slot nesnesini) renk için üç
 * türden birine sınıflandırır:
 *   - Grup dersi    → 'group-lesson' (turuncu)
 *   - Özel ders     → 'private-lesson' (yeşil)
 *   - Rezervasyon   → 'reservation' (mor)
 *
 * Karar sırası:
 *  1. membershipType BİLİNİYORSA o belirler (en güvenilir):
 *     - grup üyeliği  → grup dersi
 *     - ders üyeliği  → özel ders   (1/2 kişilik paketler dahil; groupId olsa BİLE)
 *     - kort kiralama → rezervasyon
 *  2. membershipType yoksa/tanınmıyorsa alan işaretlerine düş:
 *     - grup işareti  → grup dersi
 *     - ders işareti  → özel ders
 *     - hiçbiri       → rezervasyon
 *
 * @param doc                Rezervasyon dokümanı / occupied slot
 * @param isGroupMembership  membershipType grup mu? (opsiyonel; yoksa statik)
 */
export function classifyReservationKind(
  doc: RawReservationDoc,
  isGroupMembership?: IsGroupMembership,
): ReservationKind {
  const membershipType = typeof doc.membershipType === 'string' ? doc.membershipType : ''

  // 1) membershipType bilindiğinde KARAR ONUNDUR (grup/groupId heuristiğini ezer).
  if (membershipType) {
    if (isLessonMembership(membershipType)) {
      // Resolver (store) varsa ona güven; ANCAK store bu anahtarı tanımayıp false
      // dönerse (boş/eksik tablo, legacy key) statik heuristik grup tespitiyle
      // emniyete al. Böylece store yüklenmeden de grup dersi yanlışlıkla "özel"
      // (yeşil) görünmez.
      const isGroup = isGroupMembership
        ? isGroupMembership(membershipType) || staticIsGroupMembership(membershipType)
        : staticIsGroupMembership(membershipType)
      return isGroup ? 'group-lesson' : 'private-lesson'
    }
    // Bilinen kort-kiralama üyeliği → rezervasyon.
    if (membershipType.toLowerCase().startsWith('court_rental')) return 'reservation'
    // Tanınmayan membershipType: aşağıdaki alan-işareti mantığına düş.
  }

  // 2) membershipType yok/tanınmıyor → alan işaretleri.
  if (hasGroupMarkers(doc)) return 'group-lesson'
  if (hasLessonMarkers(doc)) return 'private-lesson'
  return 'reservation'
}

/** Sınıflandırılmış türe göre takvim rengini döndürür. */
export function getReservationTypeColor(
  doc: RawReservationDoc,
  isGroupMembership?: IsGroupMembership,
): string {
  return RESERVATION_TYPE_COLORS[classifyReservationKind(doc, isGroupMembership)]
}
