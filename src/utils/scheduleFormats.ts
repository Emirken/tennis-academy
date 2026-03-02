/**
 * Schedule format conversion utilities.
 * StudentManagement uses: day (English, e.g. 'monday'), court ('court-1')
 * GroupManagement uses: day (Turkish, e.g. 'Pazartesi'), court ('K1')
 * Firestore/courtSchedule uses: court ('K1', 'K2', 'K3')
 */

export interface ScheduleSlotBase {
  day: string
  time: string
  court: string
}

/** StudentManagement format: day in English, court as court-1 */
export interface StudentScheduleSlot extends ScheduleSlotBase {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  court: 'court-1' | 'court-2' | 'court-3'
}

/** GroupManagement format: day in Turkish, court as K1/K2/K3 */
export interface GroupScheduleSlot extends ScheduleSlotBase {
  day: string // Pazartesi, Salı, etc.
  court: 'K1' | 'K2' | 'K3'
}

/** Canonical format for storage: English day, K-format court */
export interface CanonicalScheduleSlot extends ScheduleSlotBase {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  court: 'K1' | 'K2' | 'K3'
}

const DAY_ENGLISH_TO_TURKISH: Record<string, string> = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar'
}

const DAY_TURKISH_TO_ENGLISH: Record<string, string> = {
  Pazartesi: 'monday',
  Salı: 'tuesday',
  Çarşamba: 'wednesday',
  Perşembe: 'thursday',
  Cuma: 'friday',
  Cumartesi: 'saturday',
  Pazar: 'sunday'
}

const COURT_TO_K: Record<string, string> = {
  'court-1': 'K1',
  'court-2': 'K2',
  'court-3': 'K3',
  K1: 'K1',
  K2: 'K2',
  K3: 'K3'
}

const COURT_FROM_K: Record<string, string> = {
  K1: 'court-1',
  K2: 'court-2',
  K3: 'court-3'
}

/**
 * Convert day name from English to Turkish
 */
export function dayToTurkish(day: string): string {
  const lower = day?.toLowerCase?.() || ''
  return DAY_ENGLISH_TO_TURKISH[lower] || day
}

/**
 * Convert day name from Turkish to English
 */
export function dayToEnglish(day: string): string {
  return DAY_TURKISH_TO_ENGLISH[day] || day?.toLowerCase?.() || day
}

/**
 * Convert court ID to K-format (K1, K2, K3) for Firestore/courtSchedule
 */
export function courtToKFormat(court: string): string {
  if (!court) return court
  return COURT_TO_K[court] || court
}

/**
 * Convert K-format court to court-X format for StudentManagement UI
 */
export function courtFromKFormat(k: string): string {
  if (!k) return k
  return COURT_FROM_K[k] || k
}

/**
 * Convert StudentManagement weeklyPlan format to GroupManagement schedule format
 */
export function studentToGroupFormat(slots: ScheduleSlotBase[]): GroupScheduleSlot[] {
  return slots
    .filter(s => s.day && s.time && s.court)
    .map(s => ({
      day: dayToTurkish(s.day),
      time: s.time,
      court: courtToKFormat(s.court) as 'K1' | 'K2' | 'K3'
    }))
}

/**
 * Convert GroupManagement schedule format to StudentManagement weeklyPlan format
 */
export function groupToStudentFormat(slots: ScheduleSlotBase[]): Array<{ day: string; time: string; court: string }> {
  return slots
    .filter(s => s.day && s.time && s.court)
    .map(s => ({
      day: dayToEnglish(s.day),
      time: s.time,
      court: courtFromKFormat(s.court)
    }))
}

/**
 * Convert to canonical format (English day, K court) for internal use
 */
export function toCanonicalFormat(slots: ScheduleSlotBase[]): CanonicalScheduleSlot[] {
  return slots
    .filter(s => s.day && s.time && s.court)
    .map(s => ({
      day: (dayToEnglish(s.day) || s.day.toLowerCase()) as CanonicalScheduleSlot['day'],
      time: s.time,
      court: courtToKFormat(s.court) as 'K1' | 'K2' | 'K3'
    }))
}

/**
 * Normalize slots for comparison - farklı formatlardaki planları karşılaştırmak için
 * (Pazartesi/K1 ile monday/court-1 aynı sayılır)
 */
export function normalizeForComparison(slots: ScheduleSlotBase[]): string {
  const canonical = toCanonicalFormat(slots)
  return JSON.stringify(canonical.map(s => ({ day: s.day, time: s.time, court: s.court })))
}
