// Öğrenci rezervasyon penceresi:
// - Her akşam 20:00'de açık gün 1 ileri kayar.
// - Açılan gün, ertesi gün 20:00'ye kadar tek aktif gün olarak kalır.
//
// Örnek (yerel saat):
//   17 May 20:00 → 25 May açık
//   18 May 19:59 → 25 May hâlâ açık
//   18 May 20:00 → 26 May açık (25 May artık kapalı)

export const RESERVATION_OPEN_HOUR = 20
export const RESERVATION_OFFSET_DAYS = 8

/**
 * Şu anki zamana göre rezervasyona açık olan tek günü (YYYY-MM-DD) döndürür.
 * Hiçbir gün açık değilse null döner.
 *
 * Mantık:
 * - Saat >= 20:00 ise: bugün + 8 gün açıktır.
 * - Saat < 20:00 ise: dün 20:00'de açılan gün hâlâ açıktır,
 *   yani (bugün - 1) + 8 gün = bugün + 7 gün.
 */
export function getOpenReservationDate(now: Date = new Date()): string | null {
  const openDate = new Date(now)
  openDate.setHours(0, 0, 0, 0)

  if (now.getHours() >= RESERVATION_OPEN_HOUR) {
    openDate.setDate(openDate.getDate() + RESERVATION_OFFSET_DAYS)
  } else {
    openDate.setDate(openDate.getDate() + (RESERVATION_OFFSET_DAYS - 1))
  }

  return toDateString(openDate)
}

/**
 * Verilen tarih (YYYY-MM-DD) rezervasyon için açık mı?
 */
export function isReservationDateOpen(dateStr: string, now: Date = new Date()): boolean {
  const openDate = getOpenReservationDate(now)
  if (!openDate) return false
  return dateStr === openDate
}

/**
 * Bir sonraki açılma anı (insan okur formatta) — kullanıcıya bilgi vermek için.
 * Her zaman gelecekteki en yakın 20:00 anını döndürür.
 */
export function getNextOpenAt(now: Date = new Date()): Date {
  const next = new Date(now)
  next.setMinutes(0, 0, 0)
  if (now.getHours() >= RESERVATION_OPEN_HOUR) {
    next.setDate(next.getDate() + 1)
  }
  next.setHours(RESERVATION_OPEN_HOUR, 0, 0, 0)
  return next
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
