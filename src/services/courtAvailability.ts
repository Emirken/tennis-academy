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
 * Normalize court ID to K format (K1, K2, K3)
 */
export const normalizeCourtToK = (court: string): string => {
  return courtToK[court] || court
}

/**
 * Normalize court ID to court format (court-1, court-2, court-3)
 */
export const normalizeCourtToCourt = (court: string): string => {
  return kToCourt[court] || court
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

/**
 * Load all occupied weekly slots from groups and individual student schedules
 */
export const loadOccupiedSlots = async (excludeGroupId?: string, excludeStudentId?: string): Promise<OccupiedSlot[]> => {
  const occupiedSlots: OccupiedSlot[] = []

  try {
    // 1. Load all group schedules
    const groupsRef = collection(db, 'groups')
    const groupsSnapshot = await getDocs(groupsRef)

    groupsSnapshot.forEach((doc) => {
      const group = doc.data()
      const groupId = doc.id

      // Skip the excluded group (when editing a group)
      if (excludeGroupId && groupId === excludeGroupId) return

      if (group.schedule && Array.isArray(group.schedule)) {
        group.schedule.forEach((slot: { day: string; time: string; court: string }) => {
          if (slot.day && slot.time && slot.court) {
            occupiedSlots.push({
              day: normalizeDayToEnglish(slot.day),
              time: slot.time,
              court: normalizeCourtToK(slot.court),
              groupId,
              groupName: group.name,
              isGroup: true
            })
          }
        })
      }
    })

    // 2. Load individual student schedules (non-group memberships)
    const usersRef = collection(db, 'users')
    const studentsQuery = query(usersRef, where('role', '==', 'student'))
    const studentsSnapshot = await getDocs(studentsQuery)

    studentsSnapshot.forEach((doc) => {
      const student = doc.data()
      const studentId = doc.id

      // Ghost cleanup: skip deleted students
      if (student.deleted === true) return

      // Skip the excluded student (when editing a student)
      if (excludeStudentId && studentId === excludeStudentId) return

      // Skip if student is in a group (their schedule is managed by the group)
      if (student.groupAssignment) return

      // Check for individual weekly plan
      if (student.groupSchedule?.weeklyPlan && Array.isArray(student.groupSchedule.weeklyPlan)) {
        student.groupSchedule.weeklyPlan.forEach((slot: { day: string; time: string; court: string }) => {
          if (slot.day && slot.time && slot.court) {
            occupiedSlots.push({
              day: normalizeDayToEnglish(slot.day),
              time: slot.time,
              court: normalizeCourtToK(slot.court),
              studentId,
              studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
              isGroup: false
            })
          }
        })
      }
    })

    console.log(`✅ Loaded ${occupiedSlots.length} occupied slots`)
  } catch (error) {
    console.error('❌ Error loading occupied slots:', error)
  }

  return occupiedSlots
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
 * Get available time options for a specific day and court
 */
export const getAvailableTimeOptions = (
  occupiedSlots: OccupiedSlot[],
  day: string,
  court: string,
  allTimeOptions: string[]
): Array<{ title: string; value: string; disabled?: boolean; subtitle?: string }> => {
  const normalizedDay = normalizeDayToEnglish(day)
  const normalizedCourt = normalizeCourtToK(court)

  return allTimeOptions.map(time => {
    const occupied = occupiedSlots.find(
      slot => 
        slot.day === normalizedDay && 
        slot.time === time && 
        slot.court === normalizedCourt
    )

    if (occupied) {
      const occupiedBy = occupied.isGroup 
        ? `(${occupied.groupName || 'Grup'})` 
        : `(${occupied.studentName || 'Öğrenci'})`
      
      return {
        title: `${time} - DOLU ${occupiedBy}`,
        value: time,
        disabled: true,
        subtitle: getOccupiedSlotInfo(occupied)
      }
    }

    return {
      title: time,
      value: time,
      disabled: false
    }
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
  courtFormat: 'K' | 'court' = 'K'
): Array<{ title: string; value: string; disabled?: boolean; subtitle?: string }> => {
  const normalizedDay = normalizeDayToEnglish(day)

  return allCourtOptions.map(court => {
    const normalizedCourt = normalizeCourtToK(court.value)
    
    const occupied = occupiedSlots.find(
      slot => 
        slot.day === normalizedDay && 
        slot.time === time && 
        slot.court === normalizedCourt
    )

    if (occupied) {
      const occupiedBy = occupied.isGroup 
        ? `(${occupied.groupName || 'Grup'})` 
        : `(${occupied.studentName || 'Öğrenci'})`
      
      return {
        title: `${court.title} - DOLU ${occupiedBy}`,
        value: court.value,
        disabled: true,
        subtitle: getOccupiedSlotInfo(occupied)
      }
    }

    return {
      title: court.title,
      value: court.value,
      disabled: false
    }
  })
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
