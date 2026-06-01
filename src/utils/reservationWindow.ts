// Öğrenci rezervasyon penceresi (HAFTALIK):
// - Her PAZAR 20:00'de bir sonraki haftanın tamamı açılır: Pazartesi–Pazar (7 gün).
//   Açılışın yapıldığı Pazar günü pencereye DAHİL DEĞİLDİR.
// - Açılan hafta, bir sonraki Pazar 20:00'ye kadar açık kalır; o an 7 gün ileri kayar.
//
// Örnek (yerel saat):
//   Pazar 31 May 2026 @ 20:00 → pencere = Pzt 1 Haz … Paz 7 Haz 2026
//   Bu pencere Paz 7 Haz @ 20:00'ye kadar açık kalır; o an Pzt 8 Haz … Paz 14 Haz'a kayar.
//   Son gün (sonraki Pazar) son slotuna (22:00) kadar rezerve edilebilir.

export const RESERVATION_OPEN_HOUR = 20
// Pencere açılış günü: Pazar (Date.getDay() === 0)
export const RESERVATION_OPEN_WEEKDAY = 0

export interface ReservationRange {
  start: string // Pazartesi, YYYY-MM-DD
  end: string   // Sonraki Pazar, YYYY-MM-DD
}

/**
 * now'a göre en son geçilen "Pazar 20:00" sınırını döndürür (saat 20:00'e set edilir).
 * Her gerçek tarih için geçmişte bir Pazar 20:00 vardır, bu yüzden daima bir Date döner.
 */
function getCurrentSundayBoundary(now: Date): Date {
  const b = new Date(now)
  b.setHours(RESERVATION_OPEN_HOUR, 0, 0, 0)

  // Bugün Pazar ve saat >= 20:00 ise sınır bugündür.
  if (now.getDay() === RESERVATION_OPEN_WEEKDAY && now.getHours() >= RESERVATION_OPEN_HOUR) {
    return b
  }

  // Aksi halde en yakın geçmişteki Pazar 20:00'ye geri yürü.
  do {
    b.setDate(b.getDate() - 1)
  } while (b.getDay() !== RESERVATION_OPEN_WEEKDAY)

  return b
}

/**
 * Şu an rezervasyona açık olan hafta aralığını döndürür.
 * start = Pazartesi (sınır + 1 gün), end = sonraki Pazar (sınır + 7 gün).
 */
export function getOpenReservationRange(now: Date = new Date()): ReservationRange | null {
  const boundary = getCurrentSundayBoundary(now)

  const start = new Date(boundary)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + 1) // Pazartesi

  const end = new Date(boundary)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 7) // sonraki Pazar

  return { start: toDateString(start), end: toDateString(end) }
}

/**
 * Geriye dönük uyumluluk: pencerenin başlangıç gününü (Pazartesi) döndürür.
 */
export function getOpenReservationDate(now: Date = new Date()): string | null {
  return getOpenReservationRange(now)?.start ?? null
}

/**
 * Verilen tarih (YYYY-MM-DD) açık hafta aralığında mı? [start, end] dahil.
 * YYYY-MM-DD formatında leksikografik string karşılaştırması doğrudur.
 */
export function isReservationDateOpen(dateStr: string, now: Date = new Date()): boolean {
  const range = getOpenReservationRange(now)
  if (!range) return false
  return dateStr >= range.start && dateStr <= range.end
}

/**
 * Bir sonraki açılış anı: gelecekteki en yakın "Pazar 20:00".
 */
export function getNextOpenAt(now: Date = new Date()): Date {
  const next = new Date(now)
  next.setMinutes(0, 0, 0)

  // Bugün Pazar ve henüz 20:00 olmadıysa, açılış bugündür.
  if (now.getDay() === RESERVATION_OPEN_WEEKDAY && now.getHours() < RESERVATION_OPEN_HOUR) {
    next.setHours(RESERVATION_OPEN_HOUR, 0, 0, 0)
    return next
  }

  // Aksi halde sonraki Pazar'a ilerle.
  do {
    next.setDate(next.getDate() + 1)
  } while (next.getDay() !== RESERVATION_OPEN_WEEKDAY)

  next.setHours(RESERVATION_OPEN_HOUR, 0, 0, 0)
  return next
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
