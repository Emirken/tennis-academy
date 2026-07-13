// Periyodik kort kapatma kuralları — SAF (yan etkisiz) çözümleme mantığı.
//
// "Her <hafta günü> <endDate>'e kadar kortlar bakım/kapalı" kuralı Firestore
// `recurringCourtBlocks` koleksiyonunda tutulur (bkz. services/recurringBlocks.ts).
// Bu modül bir kural listesini verilen TARİH için courtId -> time -> status
// haritasına çözer; buildCourtSchedule'ın `adminBlocks` girdisi olarak tüm
// tüketicilere (Courts, ReservationForm, StudentCourtCalendar, AdminCalendar,
// groupScheduleSync) aynı sonucu verir. TEK kaynak — mantığı kopyalama.

export type RecurringBlockStatus = 'maintenance' | 'closed'

export interface RecurringCourtBlock {
  id?: string
  /** JS getDay(): 0=Pazar .. 6=Cumartesi */
  dayOfWeek: number
  status: RecurringBlockStatus
  /** YYYY-MM-DD (dahil) */
  startDate: string
  /** YYYY-MM-DD (dahil) */
  endDate: string
  /** HAM Firestore kort id'leri (court-1, ...). Boş dizi = TÜM kortlar. */
  courtIds: string[]
  reason?: string
  createdBy?: string
  createdAt?: unknown
}

/** UI etiketleri: JS getDay() sırasına göre Türkçe gün adları (0=Pazar). */
export const DAY_INDEX_LABEL_TR = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const

/** YYYY-MM-DD → yerel Date (parça bazlı kurulur; tz kayması olmaz). */
function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = String(ymd).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** Kural verilen tarihte (YYYY-MM-DD) geçerli mi? */
export function ruleAppliesToDate(rule: RecurringCourtBlock, ymd: string): boolean {
  if (!rule || typeof rule.dayOfWeek !== 'number') return false
  if (!ymd || !rule.startDate || !rule.endDate) return false
  const date = ymdToLocalDate(ymd)
  if (Number.isNaN(date.getTime())) return false
  if (date.getDay() !== rule.dayOfWeek) return false
  // String kıyas yeterli: YYYY-MM-DD leksikografik = kronolojik.
  return ymd >= rule.startDate && ymd <= rule.endDate
}

/** Kural verilen HAM kort id'sini kapsıyor mu? (boş courtIds = tüm kortlar) */
export function ruleCoversCourt(rule: RecurringCourtBlock, rawCourtId: string): boolean {
  const ids = Array.isArray(rule.courtIds) ? rule.courtIds : []
  return ids.length === 0 || ids.includes(rawCourtId)
}

/**
 * groupScheduleSync guard'ı için: verilen tarihte HAM kort id'si periyodik
 * kuralla bloklu mu? (Kurallar tüm günü kapattığından saat parametresi yok.)
 * Blokluysa kuralın status'unu, değilse null döner.
 */
export function dateBlockStatusForCourt(
  rules: RecurringCourtBlock[],
  ymd: string,
  rawCourtId: string,
): RecurringBlockStatus | null {
  for (const rule of rules || []) {
    if (ruleAppliesToDate(rule, ymd) && ruleCoversCourt(rule, rawCourtId)) {
      return rule.status
    }
  }
  return null
}

export interface ResolveRecurringBlocksInput {
  rules: RecurringCourtBlock[]
  /** Çözülecek gün (YYYY-MM-DD). */
  date: string
  /** HAM kort id evreni (boş courtIds kurallarının açılacağı liste). */
  allCourtIds: string[]
  /** Günün saat dilimleri ('07:00' ...). Kurallar tüm günü kapatır. */
  timeSlots: string[]
  /** Ham id → ekran id (court-1 → K1). Verilmezse ham id anahtar olur. */
  mapCourtId?: (courtId: string) => string
}

/**
 * Kuralları verilen tarih için buildCourtSchedule `adminBlocks` biçimine
 * çözer: courtId -> time -> 'maintenance' | 'closed'. Aynı slotu kapsayan
 * birden çok kural varsa İLK eşleşen kazanır (liste sırası).
 */
export function resolveRecurringBlocksForDate(
  input: ResolveRecurringBlocksInput,
): Record<string, Record<string, RecurringBlockStatus>> {
  const { rules, date, allCourtIds, timeSlots } = input
  const mapCourtId = input.mapCourtId || ((id: string) => id)
  const result: Record<string, Record<string, RecurringBlockStatus>> = {}
  for (const rule of rules || []) {
    if (!ruleAppliesToDate(rule, date)) continue
    const targets =
      Array.isArray(rule.courtIds) && rule.courtIds.length > 0 ? rule.courtIds : allCourtIds
    for (const rawId of targets) {
      const courtId = mapCourtId(rawId)
      if (!result[courtId]) result[courtId] = {}
      for (const time of timeSlots) {
        if (!result[courtId][time]) result[courtId][time] = rule.status
      }
    }
  }
  return result
}
