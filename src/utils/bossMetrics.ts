// Patron (boss) monitoring paneli için SAF (yan etkisiz) hesaplama yardımcıları.
//
// Bu modül UI ve Firestore'dan bağımsızdır; yalnızca ham veriden metrik üretir,
// böylece kolayca birim test edilebilir. Tarih normalizasyonu ve ders/dolu
// ayrımı için MEVCUT util'ler yeniden kullanılır (yeniden yazılmaz):
//   - normalizeReservationDate: string | Timestamp | Date → yerel YYYY-MM-DD
//   - isLessonDoc:              kayıt bir DERS mi (kort rezervasyonu değil)
//   - isSlotBlockingReservation: kayıt slotu DOLU tutuyor mu (iptal/no_show hariç)
//
// ÖNEMLİ (memory): Ders ile rezervasyon farklı kavramlardır; ikisi de
// `reservations` koleksiyonunda durur. Patron panelindeki rezervasyon sayıları
// YALNIZCA kort rezervasyonlarını kapsar — dersler isLessonDoc ile elenir.

import {
  isLessonDoc,
  isSlotBlockingReservation,
  normalizeReservationDate,
  type RawReservationDoc,
} from './dailyReservationLimit'

// ---------------------------------------------------------------------------
// Tarih yardımcıları (yerel saat; UTC kayması yaşatmamak için string bazlı)
// ---------------------------------------------------------------------------

/** Bir Date'i yerel YYYY-MM-DD'ye çevirir (toISOString/UTC DEĞİL). */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Verilen referans tarihinin içinde bulunduğu haftanın (Pazartesi→Pazar)
 * başlangıç ve bitiş tarihlerini YYYY-MM-DD olarak döndürür.
 *
 * getDay(): 0=Pazar ... 6=Cumartesi. Pazartesi başlangıç için Pazar'ı (0)
 * 7 gün geriye, diğer günleri (gün-1) geriye alırız.
 */
export function getWeekRange(refDate: Date): { start: string; end: string } {
  const day = refDate.getDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - diffToMonday)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  return { start: toLocalDateString(monday), end: toLocalDateString(sunday) }
}

// ---------------------------------------------------------------------------
// Rezervasyon sayımı
// ---------------------------------------------------------------------------

export interface ReservationCounts {
  daily: number
  weekly: number
  monthly: number
}

/**
 * Verilen referans tarihine göre günlük / haftalık / aylık KORT rezervasyon
 * sayılarını hesaplar.
 *
 * Eleme kuralları (her doküman için):
 *  - Ders (grup/özel) ise SAYILMAZ (isLessonDoc) — yalnızca kort rezervasyonu.
 *  - Slotu DOLU tutmuyorsa (iptal/no_show) SAYILMAZ (isSlotBlockingReservation).
 *  - Tarihi çözülemiyorsa SAYILMAZ.
 *
 * Sınırlar:
 *  - daily   = refDate ile aynı gün.
 *  - weekly  = refDate'in içinde bulunduğu hafta (Pazartesi→Pazar dahil).
 *  - monthly = refDate ile aynı yıl+ay.
 */
export function countCourtReservationsByPeriod(
  docs: RawReservationDoc[],
  refDate: Date,
): ReservationCounts {
  const today = toLocalDateString(refDate)
  const month = today.slice(0, 7) // YYYY-MM
  const { start: weekStart, end: weekEnd } = getWeekRange(refDate)

  const counts: ReservationCounts = { daily: 0, weekly: 0, monthly: 0 }

  for (const doc of docs) {
    if (isLessonDoc(doc)) continue
    if (!isSlotBlockingReservation(doc)) continue

    const dateStr = normalizeReservationDate(doc.date)
    if (!dateStr) continue

    if (dateStr.slice(0, 7) === month) counts.monthly++
    if (dateStr >= weekStart && dateStr <= weekEnd) counts.weekly++
    if (dateStr === today) counts.daily++
  }

  return counts
}

// ---------------------------------------------------------------------------
// Aylık ciro (aktif öğrenci × paket fiyatı)
// ---------------------------------------------------------------------------

// Ciro hesabı için ihtiyaç duyulan minimal öğrenci alanları. Gerçek Student
// tipinden daha gevşek tutulur ki ham Firestore dokümanıyla da çalışsın.
export interface RevenueStudentLike {
  membershipType?: string
  status?: string
  deleted?: boolean
}

// Paket fiyat tablosu: key → { name, monthlyPrice }. membershipTypes store'unun
// typesMap'inden ya da ham MembershipType[] listesinden kurulabilir.
export interface PackagePriceInfo {
  name?: string
  monthlyPrice?: number
}

export interface PackageRevenueRow {
  key: string
  name: string
  count: number
  unitPrice: number
  subtotal: number
}

export interface MonthlyRevenue {
  total: number
  byPackage: PackageRevenueRow[]
}

// Ciroya dahil EDİLMEYEN öğrenci durumları. Bilinmeyen/boş status dahil edilir
// (güvenli taraf: aktif kabul). deleted === true her zaman elenir.
const INACTIVE_STUDENT_STATUSES = new Set(['inactive', 'suspended', 'expired'])

/** Öğrenci ciro hesabına dahil mi? (silinmemiş ve pasif/askıda değil) */
function isActiveStudent(student: RevenueStudentLike): boolean {
  if (student.deleted === true) return false
  if (student.status && INACTIVE_STUDENT_STATUSES.has(student.status)) return false
  return true
}

/**
 * Aktif öğrencilerin paketlerine göre beklenen aylık ciroyu hesaplar.
 *
 *   ciro(paket) = AKTİF öğrenci sayısı(paket) × paket.monthlyPrice
 *
 * - typesMap'te olmayan / fiyatı tanımsız paket 0 fiyatla ele alınır
 *   (sayım yine yapılır, ara toplam 0 olur).
 * - Sonuç byPackage ara toplamına göre azalan sıralanır.
 */
export function computeMonthlyRevenue(
  students: RevenueStudentLike[],
  typesMap: Record<string, PackagePriceInfo>,
): MonthlyRevenue {
  const rows = new Map<string, PackageRevenueRow>()

  for (const student of students) {
    if (!isActiveStudent(student)) continue

    const key = student.membershipType || 'basic'
    const info = typesMap[key]
    const unitPrice = info?.monthlyPrice ?? 0
    const name = info?.name ?? key

    const existing = rows.get(key)
    if (existing) {
      existing.count++
      existing.subtotal = existing.count * existing.unitPrice
    } else {
      rows.set(key, { key, name, count: 1, unitPrice, subtotal: unitPrice })
    }
  }

  const byPackage = Array.from(rows.values()).sort((a, b) => b.subtotal - a.subtotal)
  const total = byPackage.reduce((sum, row) => sum + row.subtotal, 0)

  return { total, byPackage }
}
