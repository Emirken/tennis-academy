import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/services/firebase'

export interface OccupiedSlot {
  day: string
  time: string
  court: string
  groupId?: string
  groupName?: string
  studentId?: string
  studentName?: string
  isGroup: boolean
}

// Day name mappings
const dayNameToEnglish: Record<string, string> = {
  'Pazartesi': 'monday',
  'Salı': 'tuesday',
  'Çarşamba': 'wednesday',
  'Perşembe': 'thursday',
  'Cuma': 'friday',
  'Cumartesi': 'saturday',
  'Pazar': 'sunday'
}

const dayNameToTurkish: Record<string, string> = {
  'monday': 'Pazartesi',
  'tuesday': 'Salı',
  'wednesday': 'Çarşamba',
  'thursday': 'Perşembe',
  'friday': 'Cuma',
  'saturday': 'Cumartesi',
  'sunday': 'Pazar'
}

// Court ID mappings
const courtToK: Record<string, string> = {
  'court-1': 'K1',
  'court-2': 'K2',
  'court-3': 'K3'
}

const kToCourt: Record<string, string> = {
  'K1': 'court-1',
  'K2': 'court-2',
  'K3': 'court-3'
}

/**
 * Kort değerinin sayısal kort numarasını taşıyan yazımlarını yakalar:
 * 'K2', 'k2', 'court-2', 'Kort 2', 'kort_2', '2' → hepsi 2 numaralı kort.
 * Serbest metin kort adları ('Merkez Kort') eşleşmez, ham haliyle korunur.
 */
const COURT_NUMBER_PATTERN = /^(?:kort|court|k)?[\s._-]*([1-9][0-9]*)$/i

/**
 * Normalize court ID to K format (K1, K2, K3)
 *
 * NOT: Aynı kort veritabanında birden çok yazımla durabiliyor ('K2', 'court-2',
 * 'Kort 2' — migration ve farklı form ekranlarının mirası). Yalnızca 'court-N'
 * eşlenirse 'Kort 2' ayrı bir kort kimliği gibi davranır: doluluk kaçar ve
 * v-select değeri listede bulamayıp ham metni ('K2') gösterir.
 */
export const normalizeCourtToK = (court: string): string => {
  if (!court) return court
  const raw = String(court).trim()
  const direct = courtToK[raw]
  if (direct) return direct
  const match = COURT_NUMBER_PATTERN.exec(raw)
  return match ? `K${match[1]}` : raw
}

/**
 * Normalize court ID to court format (court-1, court-2, court-3)
 */
export const normalizeCourtToCourt = (court: string): string => {
  if (!court) return court
  const k = normalizeCourtToK(court)
  if (kToCourt[k]) return kToCourt[k]
  const match = /^K([1-9][0-9]*)$/.exec(k)
  return match ? `court-${match[1]}` : k
}

/**
 * Normalize day name to English format
 */
export const normalizeDayToEnglish = (day: string): string => {
  return dayNameToEnglish[day] || day.toLowerCase()
}

/**
 * Normalize day name to Turkish format
 */
export const normalizeDayToTurkish = (day: string): string => {
  return dayNameToTurkish[day] || day
}

// --------------------------------------------------------------------------
// Saf doluluk kurulumu (Firestore'dan bağımsız → birim test edilebilir)
// --------------------------------------------------------------------------

export interface ScheduleSlotLike {
  day?: string | null
  time?: string | null
  court?: string | null
}

export interface GroupLike {
  id: string
  name?: string
  schedule?: ScheduleSlotLike[]
  members?: Array<{ id?: string } | string>
}

export interface StudentLike {
  id: string
  firstName?: string
  lastName?: string
  deleted?: boolean
  groupAssignment?: string | null
  groupSchedule?: { weeklyPlan?: ScheduleSlotLike[] } | null
}

const memberIdsOf = (group: GroupLike): string[] =>
  (group.members ?? [])
    .map(m => (typeof m === 'string' ? m : m?.id))
    .filter((id): id is string => !!id)

/**
 * DOLU slot listesini kurar. İKİ KURAL (tenis-project-new
 * `buildOccupiedSlots` paritesi):
 *
 *  1. GRUP ÜYELERİ AYNI SLOTU PAYLAŞIR → çakışma değildir. Grup programı üye
 *     başına `users/{id}.groupSchedule.weeklyPlan` içine kopyalanır; bunları
 *     tek tek "dolu" saymak grubun kendi slotunu sahte çakışma yapar. Üyelik
 *     `groups/{id}.members[]` üzerinden belirlenir — `groupAssignment` alanına
 *     güvenmek yetmiyor: migration/öğrenci-düzenleme yollarında bu alan boş
 *     kalabiliyor ve slot geri sızıyordu (bug raporu: "Seçilen programda
 *     çakışma var: monday 18:00").
 *
 *  2. DÜZENLENEN KAYIT KENDİSİYLE ÇAKIŞAMAZ. Düzenlenen grup (excludeGroupId)
 *     ve düzenlenen öğrencinin ÜYE OLDUĞU grup(lar) listeden düşer; öğrenci
 *     düzenleme formu planı zaten o gruptan yüklüyor.
 */
export const buildOccupiedSlots = (input: {
  groups?: GroupLike[]
  students?: StudentLike[]
  excludeGroupId?: string
  excludeStudentId?: string
}): OccupiedSlot[] => {
  const groups = input.groups ?? []
  const students = input.students ?? []
  const occupiedSlots: OccupiedSlot[] = []

  // Bir gruba üye olan tüm öğrenci id'leri (kural 1)
  const groupedStudentIds = new Set<string>()
  groups.forEach(g => memberIdsOf(g).forEach(id => groupedStudentIds.add(id)))

  // Hariç tutulacak gruplar (kural 2)
  const excludedGroupIds = new Set<string>()
  if (input.excludeGroupId) excludedGroupIds.add(input.excludeGroupId)
  if (input.excludeStudentId) {
    const studentId = input.excludeStudentId
    groups.forEach(g => {
      if (memberIdsOf(g).includes(studentId)) excludedGroupIds.add(g.id)
    })
  }

  // 1) Grup programları
  groups.forEach(group => {
    if (excludedGroupIds.has(group.id)) return
    ;(group.schedule ?? []).forEach(slot => {
      if (slot?.day && slot.time && slot.court) {
        occupiedSlots.push({
          day: normalizeDayToEnglish(slot.day),
          time: slot.time,
          court: normalizeCourtToK(slot.court),
          groupId: group.id,
          groupName: group.name,
          isGroup: true
        })
      }
    })
  })

  // 2) Bireysel (gruba üye OLMAYAN) öğrencilerin haftalık planı
  students.forEach(student => {
    if (student.deleted === true) return
    if (input.excludeStudentId && student.id === input.excludeStudentId) return
    if (student.groupAssignment) return
    if (groupedStudentIds.has(student.id)) return

    ;(student.groupSchedule?.weeklyPlan ?? []).forEach(slot => {
      if (slot?.day && slot.time && slot.court) {
        occupiedSlots.push({
          day: normalizeDayToEnglish(slot.day),
          time: slot.time,
          court: normalizeCourtToK(slot.court),
          studentId: student.id,
          studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          isGroup: false
        })
      }
    })
  })

  return occupiedSlots
}

/**
 * Load all occupied weekly slots from groups and individual student schedules
 */
export const loadOccupiedSlots = async (excludeGroupId?: string, excludeStudentId?: string): Promise<OccupiedSlot[]> => {
  try {
    const groupsSnapshot = await getDocs(collection(db, 'groups'))
    const groups: GroupLike[] = groupsSnapshot.docs.map(d => {
      const data = d.data() as any
      return {
        id: d.id,
        name: data.name,
        schedule: Array.isArray(data.schedule) ? data.schedule : [],
        members: Array.isArray(data.members) ? data.members : []
      }
    })

    const studentsSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'student'))
    )
    const students: StudentLike[] = studentsSnapshot.docs.map(d => {
      const data = d.data() as any
      return {
        id: d.id,
        firstName: data.firstName,
        lastName: data.lastName,
        deleted: data.deleted === true,
        groupAssignment: data.groupAssignment ?? null,
        groupSchedule: data.groupSchedule ?? null
      }
    })

    const occupiedSlots = buildOccupiedSlots({ groups, students, excludeGroupId, excludeStudentId })
    console.log(`✅ Loaded ${occupiedSlots.length} occupied slots`)
    return occupiedSlots
  } catch (error) {
    console.error('❌ Error loading occupied slots:', error)
    return []
  }
}

/**
 * Check if a specific slot is occupied
 */
export const isSlotOccupied = (
  occupiedSlots: OccupiedSlot[],
  day: string,
  time: string,
  court: string
): OccupiedSlot | null => {
  const normalizedDay = normalizeDayToEnglish(day)
  const normalizedCourt = normalizeCourtToK(court)

  return occupiedSlots.find(
    slot =>
      slot.day === normalizedDay &&
      slot.time === time &&
      slot.court === normalizedCourt
  ) || null
}

/**
 * Get occupied info text for a slot
 */
export const getOccupiedSlotInfo = (slot: OccupiedSlot): string => {
  if (slot.isGroup) {
    return `Dolu: ${slot.groupName || 'Grup'}`
  }
  return `Dolu: ${slot.studentName || 'Öğrenci'}`
}

/**
 * Seçenek üreticilerine verilen bağlam.
 *
 *  - `currentTime` / `currentCourt`: DÜZENLENEN SATIRIN kendi değeri. Bu değer
 *    asla "dolu" işaretlenmez ve listeden düşürülmez; aksi halde v-select
 *    modelValue'yu items içinde bulamayıp ham metni gösterir ve kullanıcı kendi
 *    kaydettiği slotu geri seçemez.
 *  - `allCourts` / `allTimes`: GÜN-ÖNCELİKLİ KASKAD. Kullanıcı sadece günü
 *    seçtiğinde diğer iki liste yine de boşluğa düşsün diye kullanılır: bir saat
 *    ancak o gün TÜM kortlarda doluysa kapanır, bir kort ancak o gün TÜM
 *    saatlerde doluysa kapanır.
 */
export interface SlotOptionContext {
  currentTime?: string
  currentCourt?: string
  allCourts?: string[]
  allTimes?: string[]
}

interface OptionResult {
  title: string
  value: string
  disabled?: boolean
  subtitle?: string
}

const busyOption = (title: string, value: string, suffix: string, occupied?: OccupiedSlot): OptionResult => ({
  title: `${title} - DOLU ${suffix}`,
  value,
  disabled: true,
  subtitle: occupied ? getOccupiedSlotInfo(occupied) : 'Dolu'
})

const occupiedLabel = (occupied: OccupiedSlot): string =>
  occupied.isGroup
    ? `(${occupied.groupName || 'Grup'})`
    : `(${occupied.studentName || 'Öğrenci'})`

/**
 * Get available time options for a specific day and court
 */
export const getAvailableTimeOptions = (
  occupiedSlots: OccupiedSlot[],
  day: string,
  court: string,
  allTimeOptions: string[],
  context: SlotOptionContext = {}
): OptionResult[] => {
  const normalizedDay = normalizeDayToEnglish(day)
  const normalizedCourt = court ? normalizeCourtToK(court) : ''
  const candidateCourts = (context.allCourts ?? []).map(normalizeCourtToK)

  return allTimeOptions.map(time => {
    // Satırın kendi saati her zaman seçilebilir kalır
    if (context.currentTime && time === context.currentTime) {
      return { title: time, value: time, disabled: false }
    }

    if (normalizedCourt) {
      const occupied = occupiedSlots.find(
        slot =>
          slot.day === normalizedDay &&
          slot.time === time &&
          slot.court === normalizedCourt
      )
      if (occupied) {
        return busyOption(time, time, occupiedLabel(occupied), occupied)
      }
      return { title: time, value: time, disabled: false }
    }

    // Kort henüz seçilmedi: saat ancak TÜM aday kortlarda doluysa kapanır
    const allCourtsBusy =
      candidateCourts.length > 0 &&
      candidateCourts.every(c =>
        occupiedSlots.some(
          slot => slot.day === normalizedDay && slot.time === time && slot.court === c
        )
      )
    if (allCourtsBusy) {
      return busyOption(time, time, '(tüm kortlar)')
    }

    return { title: time, value: time, disabled: false }
  })
}

/**
 * Get available court options for a specific day and time
 */
export const getAvailableCourtOptions = (
  occupiedSlots: OccupiedSlot[],
  day: string,
  time: string,
  allCourtOptions: Array<{ title: string; value: string }>,
  courtFormat: 'K' | 'court' = 'K',
  context: SlotOptionContext = {}
): OptionResult[] => {
  const normalizedDay = normalizeDayToEnglish(day)
  const candidateTimes = context.allTimes ?? []

  return allCourtOptions.map(court => {
    const normalizedCourt = normalizeCourtToK(court.value)

    // Satırın kendi kortu her zaman seçilebilir kalır
    if (context.currentCourt && normalizeCourtToK(context.currentCourt) === normalizedCourt) {
      return { title: court.title, value: court.value, disabled: false }
    }

    if (time) {
      const occupied = occupiedSlots.find(
        slot =>
          slot.day === normalizedDay &&
          slot.time === time &&
          slot.court === normalizedCourt
      )
      if (occupied) {
        return busyOption(court.title, court.value, occupiedLabel(occupied), occupied)
      }
      return { title: court.title, value: court.value, disabled: false }
    }

    // Saat henüz seçilmedi: kort ancak gün boyu doluysa kapanır
    const allDayBusy =
      candidateTimes.length > 0 &&
      candidateTimes.every(t =>
        occupiedSlots.some(
          slot => slot.day === normalizedDay && slot.time === t && slot.court === normalizedCourt
        )
      )
    if (allDayBusy) {
      return busyOption(court.title, court.value, '(gün boyu)')
    }

    return { title: court.title, value: court.value, disabled: false }
  })
}

/**
 * Seçilebilir saat seçeneklerini döndürür: DOLU slotları LİSTEDEN TAMAMEN ÇIKARIR
 * (AdminCalendar.vue `availableTimeSlots` davranışıyla aynı — orada da dolu saatler
 * `filter` ile elenir, sadece soluklaştırılmaz). Böylece dolu saat dropdown'da hiç
 * görünmez ve yanlışlıkla seçilemez.
 *
 * Not: `getAvailableTimeOptions` (disabled+etiketli liste) korunur; gerekirse görsel
 * "DOLU (X)" gösterimi için hâlâ kullanılabilir. Form select'leri bu seçilebilir
 * varyantı kullanmalıdır.
 */
export const getSelectableTimeOptions = (
  occupiedSlots: OccupiedSlot[],
  day: string,
  court: string,
  allTimeOptions: string[],
  context: SlotOptionContext = {}
): Array<{ title: string; value: string }> => {
  return getAvailableTimeOptions(occupiedSlots, day, court, allTimeOptions, context)
    .filter(opt => !opt.disabled)
    .map(({ title, value }) => ({ title, value }))
}

/**
 * Seçilebilir kort seçeneklerini döndürür: DOLU kortları LİSTEDEN TAMAMEN ÇIKARIR
 * (AdminCalendar doluluk mantığıyla aynı). Dolu kort dropdown'da görünmez.
 */
export const getSelectableCourtOptions = (
  occupiedSlots: OccupiedSlot[],
  day: string,
  time: string,
  allCourtOptions: Array<{ title: string; value: string }>,
  courtFormat: 'K' | 'court' = 'K',
  context: SlotOptionContext = {}
): Array<{ title: string; value: string }> => {
  return getAvailableCourtOptions(occupiedSlots, day, time, allCourtOptions, courtFormat, context)
    .filter(opt => !opt.disabled)
    .map(({ title, value }) => ({ title, value }))
}

/**
 * Check if any slot in the schedule conflicts with occupied slots
 */
export const getScheduleConflicts = (
  occupiedSlots: OccupiedSlot[],
  schedule: Array<{ day: string; time: string; court: string }>
): Array<{ index: number; slot: OccupiedSlot }> => {
  const conflicts: Array<{ index: number; slot: OccupiedSlot }> = []

  schedule.forEach((item, index) => {
    if (item.day && item.time && item.court) {
      const occupied = isSlotOccupied(occupiedSlots, item.day, item.time, item.court)
      if (occupied) {
        conflicts.push({ index, slot: occupied })
      }
    }
  })

  return conflicts
}
