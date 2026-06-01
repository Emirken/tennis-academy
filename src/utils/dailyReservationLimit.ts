// Öğrenci başına "günde en fazla bir rezervasyon" kuralı.
//
// Bir öğrencinin belirli bir tarihte zaten aktif (pending/confirmed) bir
// rezervasyonu olup olmadığını saf (yan etkisiz) bir şekilde hesaplar.
// submitReservation içindeki inline kontrolün test edilebilir karşılığıdır.

// Firestore'dan gelen ham rezervasyon dokümanı: date alanı string,
// Firestore Timestamp ({ toDate() }) veya Date olabilir.
export interface RawReservationDoc {
  studentId?: string
  status?: string
  date?: unknown
  [key: string]: unknown
}

// Günde-bir limitinde sayılan durumlar. İptal/no_show gibi durumlar sayılmaz.
export const ACTIVE_RESERVATION_STATUSES = ['pending', 'confirmed'] as const

/**
 * Çeşitli date temsillerini (string | Firestore Timestamp | Date) yerel
 * YYYY-MM-DD formatına normalize eder. Çözülemezse null döner.
 *
 * Not: Yerel tarih bileşenleri kullanılır (toISOString/UTC DEĞİL), böylece
 * UTC+3 gibi saat dilimlerinde gün kayması yaşanmaz.
 */
export function normalizeReservationDate(date: unknown): string | null {
  if (date == null) return null

  // Zaten YYYY-MM-DD ise olduğu gibi kullan.
  if (typeof date === 'string') {
    const trimmed = date.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
    const parsed = new Date(trimmed)
    return isNaN(parsed.getTime()) ? null : toLocalDateString(parsed)
  }

  // Firestore Timestamp
  if (typeof date === 'object' && date !== null && typeof (date as any).toDate === 'function') {
    const d = (date as any).toDate()
    return d instanceof Date && !isNaN(d.getTime()) ? toLocalDateString(d) : null
  }

  // Date
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : toLocalDateString(date)
  }

  // number (epoch) veya diğer parse edilebilir değerler
  const d = new Date(date as any)
  return isNaN(d.getTime()) ? null : toLocalDateString(d)
}

/**
 * Öğrencinin verilen tarihte aktif (pending/confirmed) bir rezervasyonu
 * olup olmadığını döndürür. Aynı gün yalnızca bir rezervasyon kuralı için.
 *
 * @param docs       Öğrenciye ait (ya da tüm) rezervasyon dokümanları
 * @param studentId  Kontrol edilen öğrenci
 * @param dateStr    Hedef tarih (YYYY-MM-DD)
 */
export function hasActiveReservationOnDate(
  docs: RawReservationDoc[],
  studentId: string,
  dateStr: string,
): boolean {
  if (!studentId || !dateStr) return false

  return docs.some((doc) => {
    if (doc.studentId !== studentId) return false
    if (!ACTIVE_RESERVATION_STATUSES.includes(doc.status as any)) return false
    return normalizeReservationDate(doc.date) === dateStr
  })
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
