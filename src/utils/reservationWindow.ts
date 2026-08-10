// Öğrenci rezervasyon penceresi (HAFTALIK):
// - Her PAZARTESİ 13:00'te İÇİNDE BULUNULAN haftanın tamamı açılır: Pazartesi–Pazar (7 gün).
//   Açılışın yapıldığı Pazartesi pencereye DAHİLDİR (o günün 13:00 sonrası slotları da alınabilir).
// - Açılan hafta, o haftanın Pazar günü sonuna kadar açık kalır.
// - Pazartesi 00:00–12:59 arası SİSTEM KAPALIDIR: önceki hafta bitmiştir, yeni hafta
//   henüz açılmamıştır. Bu aralıkta getOpenReservationRange null döner.
//
// Örnek (yerel saat):
//   Pzt 1 Haz 2026 @ 13:00 → pencere = Pzt 1 Haz … Paz 7 Haz 2026
//   Bu pencere Paz 7 Haz'ın son slotuna (22:00) kadar açık kalır.
//   Pzt 8 Haz 00:00–12:59 → kapalı; Pzt 8 Haz @ 13:00 → pencere 8 Haz … 14 Haz'a kayar.

export const RESERVATION_OPEN_HOUR = 13
// Pencere açılış günü: Pazartesi (Date.getDay() === 1)
export const RESERVATION_OPEN_WEEKDAY = 1

export interface ReservationRange {
  start: string // Pazartesi, YYYY-MM-DD
  end: string   // Aynı haftanın Pazar'ı, YYYY-MM-DD
}

/**
 * now'a göre en son geçilen "Pazartesi 13:00" sınırını döndürür (saat 13:00'e set edilir).
 * Her gerçek tarih için geçmişte bir Pazartesi 13:00 vardır, bu yüzden daima bir Date döner.
 */
function getCurrentOpenBoundary(now: Date): Date {
  const b = new Date(now)
  b.setHours(RESERVATION_OPEN_HOUR, 0, 0, 0)

  // Bugün Pazartesi ve saat >= 13:00 ise sınır bugündür.
  if (now.getDay() === RESERVATION_OPEN_WEEKDAY && now.getHours() >= RESERVATION_OPEN_HOUR) {
    return b
  }

  // Aksi halde en yakın geçmişteki Pazartesi 13:00'e geri yürü.
  do {
    b.setDate(b.getDate() - 1)
  } while (b.getDay() !== RESERVATION_OPEN_WEEKDAY)

  return b
}

/**
 * Şu an rezervasyona açık olan hafta aralığını döndürür.
 * start = sınırın Pazartesi'si (açılış günü DAHİL), end = aynı haftanın Pazar'ı (sınır + 6 gün).
 * Pazartesi 13:00'ten önce en son açılan hafta tamamen geçmişte kalır → null (kapalı).
 */
export function getOpenReservationRange(now: Date = new Date()): ReservationRange | null {
  const boundary = getCurrentOpenBoundary(now)

  const start = new Date(boundary)
  start.setHours(0, 0, 0, 0) // Pazartesi

  const end = new Date(start)
  end.setDate(end.getDate() + 6) // aynı haftanın Pazar'ı

  const endStr = toDateString(end)
  // Pencere tamamen geçmişte (Pazartesi 00:00–12:59) → henüz açılmadı.
  if (endStr < toDateString(now)) return null

  return { start: toDateString(start), end: endStr }
}

/**
 * Geriye dönük uyumluluk: pencerenin başlangıç gününü (Pazartesi) döndürür.
 * Sistem kapalıysa null.
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
 * Bir sonraki açılış anı: gelecekteki en yakın "Pazartesi 13:00".
 */
export function getNextOpenAt(now: Date = new Date()): Date {
  const next = new Date(now)
  next.setMinutes(0, 0, 0)

  // Bugün Pazartesi ve henüz 13:00 olmadıysa, açılış bugündür.
  if (now.getDay() === RESERVATION_OPEN_WEEKDAY && now.getHours() < RESERVATION_OPEN_HOUR) {
    next.setHours(RESERVATION_OPEN_HOUR, 0, 0, 0)
    return next
  }

  // Aksi halde sonraki Pazartesi'ye ilerle.
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
