// Günde-bir kort rezervasyonu KİLİDİ — kuralın sunucu tarafı karşılığı.
//
// dailyReservationLimit.ts'teki hasActiveReservationOnDate yalnız tarayıcıda
// çalışır: okuma ile yazma arasında birkaç await olduğundan çift gönderim
// (Enter + tık, iki sekme, iki cihaz) ya da SDK ile doğrudan yazım kuralı
// atlatabiliyordu (canlıda aynı güne iki rezervasyon).
//
// Firestore kuralları sorgu/sayım yapamaz; tek benzersizlik aracı belge
// kimliğidir. Bu yüzden her (öğrenci, gün) için deterministik kimlikli bir
// kilit belgesi tutulur: reservationDayLocks/{studentId}_{YYYY-MM-DD}.
//  - Öğrenci rezervasyonu ve kilidi AYNI batch'te yazar
//    (services/reservationDayLock.ts). Kural, rezervasyonun kilide bağlı
//    olmasını şart koşar.
//  - Kilit zaten başka bir AKTİF rezervasyonu gösteriyorsa kilit yazımı
//    reddedilir ve batch bütünüyle düşer — ikinci rezervasyon yazılmaz.
//  - Kilidin gösterdiği rezervasyon iptal/tamamlandı/silindiyse kilit
//    devralınabilir; bu yüzden iptal akışlarının kilide dokunması gerekmez.
//
// Bu dosya saf yardımcıları içerir (Firestore'a dokunmaz).

import { ACTIVE_RESERVATION_STATUSES, type RawReservationDoc } from './dailyReservationLimit'

export const DAY_LOCKS_COLLECTION = 'reservationDayLocks'

export const SAME_DAY_LIMIT_MESSAGE =
  'Aynı gün içinde yalnızca bir rezervasyon yapabilirsiniz. Lütfen farklı bir tarih seçin.'

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Değer 'YYYY-MM-DD' biçiminde ve takvimde gerçekten var olan bir gün mü? */
export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_KEY_RE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const probe = new Date(Date.UTC(year, month - 1, day))
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  )
}

function assertDateKey(dateKey: string): void {
  if (!isValidDateKey(dateKey)) {
    throw new Error(`Geçersiz tarih anahtarı: ${String(dateKey)}`)
  }
}

/** Kilit belgesinin kimliği. Kural aynı birleştirmeyi doğrular. */
export function dayLockId(studentId: string, dateKey: string): string {
  if (!studentId) throw new Error('Kilit için öğrenci kimliği gerekli')
  assertDateKey(dateKey)
  return `${studentId}_${dateKey}`
}

/**
 * Rezervasyonun `date` alanı: dateKey gününün UTC gece yarısı. Form bu alanı
 * eskiden `new Date('YYYY-MM-DD')` ile yazıyordu — değer birebir aynıdır.
 * Kural `date == timestamp.date(y, m, d)` ile tarihi dateKey'e bağlar; böylece
 * kilit X gününe alınıp rezervasyon Y gününe yazılamaz.
 */
export function dateKeyToUtcDate(dateKey: string): Date {
  assertDateKey(dateKey)
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Kilidin gösterdiği rezervasyon günü hâlâ TUTUYOR mu? Kural paritesi:
 * belge yoksa ya da durumu pending/confirmed değilse kilit serbesttir.
 */
export function isDayLockHeld(pointee: RawReservationDoc | null | undefined): boolean {
  if (!pointee) return false
  return (ACTIVE_RESERVATION_STATUSES as readonly unknown[]).includes(pointee.status)
}

/**
 * Batch kural tarafından reddedildi mi? Öğrenci akışında istemci ön kontrolü
 * geçildikten sonra gelen tek gerçekçi ret, aynı güne eşzamanlı ikinci
 * rezervasyondur (kilit başka aktif kaydı gösteriyor).
 */
export function isDayLockConflictError(error: unknown): boolean {
  return (error as { code?: unknown } | null | undefined)?.code === 'permission-denied'
}
