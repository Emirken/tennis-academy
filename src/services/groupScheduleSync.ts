/**
 * Central group schedule synchronization service.
 * Keeps groups collection, user profiles, reservations, and courtSchedule in sync.
 * Used by both StudentManagement (profile schedule change) and GroupManagement (group edit).
 */

import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { dayToTurkish, courtToKFormat, groupToStudentFormat, type ScheduleSlotBase } from '@/utils/scheduleFormats'

const BATCH_LIMIT = 450
const RESERVATION_WINDOW_MONTHS = 3
const READ_CONCURRENCY = 50

export interface GroupMember {
  id: string
  name: string
  email: string
}

export interface GroupScheduleSlot {
  day: string
  time: string
  court: string
}

export interface SyncGroupScheduleOptions {
  /** If true, only create reservations from today onwards (for profile updates). Default: false = from group creation/update */
  fromToday?: boolean
  /** Group membership type (required for reservation creation) */
  membershipType?: string
}

/**
 * Normalize schedule to Group format (Turkish day, K1/K2/K3 court)
 */
function toGroupFormat(slots: ScheduleSlotBase[]): GroupScheduleSlot[] {
  return slots
    .filter(s => s.day && s.time && s.court)
    .map(s => ({
      day: dayToTurkish(s.day),
      time: s.time,
      court: courtToKFormat(s.court)
    }))
}

/**
 * Delete future group reservations and clear court schedule.
 * Uses writeBatch and aggregates courtSchedule updates per date.
 */
export async function deleteFutureGroupReservations(groupId: string): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const reservationsRef = collection(db, 'reservations')
  const q = query(
    reservationsRef,
    where('groupId', '==', groupId),
    where('date', '>=', today)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) {
    console.log('✅ Silinecek gelecek grup rezervasyonu yok')
    return
  }

  // Phase 1: Collect courtSchedule slots to clear, grouped by date
  // dateString -> courtId -> Set<time>
  const slotsToClear = new Map<string, Map<string, Set<string>>>()

  for (const resDoc of snapshot.docs) {
    const data = resDoc.data()
    if (!data.date) continue
    try {
      const dateObj = data.date.toDate?.() || data.date
      const dateString = typeof dateObj === 'string' ? dateObj.split('T')[0] : dateObj.toISOString().split('T')[0]
      const courtId = courtToKFormat(data.courtId)

      if (!slotsToClear.has(dateString)) slotsToClear.set(dateString, new Map())
      const dateMap = slotsToClear.get(dateString)!
      if (!dateMap.has(courtId)) dateMap.set(courtId, new Set())
      dateMap.get(courtId)!.add(data.startTime)
    } catch (err) {
      console.error('Court schedule bilgisi okunamadı:', err)
    }
  }

  // Phase 2: Read affected courtSchedule docs in parallel batches
  const dateStrings = [...slotsToClear.keys()]
  const existingSchedules = new Map<string, Record<string, any>>()

  for (let i = 0; i < dateStrings.length; i += READ_CONCURRENCY) {
    const chunk = dateStrings.slice(i, i + READ_CONCURRENCY)
    const snaps = await Promise.all(
      chunk.map(ds => getDoc(doc(db, 'courtSchedule', ds)))
    )
    snaps.forEach((snap, idx) => {
      if (snap.exists()) {
        existingSchedules.set(chunk[idx], snap.data()?.schedule || {})
      }
    })
  }

  // Phase 3: Apply slot clearings in memory
  const modifiedDates = new Set<string>()
  for (const [dateString, courts] of slotsToClear) {
    const scheduleData = existingSchedules.get(dateString)
    if (!scheduleData) continue
    for (const [courtId, times] of courts) {
      if (!scheduleData[courtId]) continue
      for (const time of times) {
        if (scheduleData[courtId][time]) {
          scheduleData[courtId][time] = 'available'
          modifiedDates.add(dateString)
        }
      }
    }
  }

  // Phase 4: Batch delete reservations + update courtSchedule
  let batch = writeBatch(db)
  let opCount = 0

  const flushBatch = async () => {
    if (opCount > 0) {
      await batch.commit()
      batch = writeBatch(db)
      opCount = 0
    }
  }

  for (const resDoc of snapshot.docs) {
    batch.delete(resDoc.ref)
    opCount++
    if (opCount >= BATCH_LIMIT) await flushBatch()
  }

  for (const dateString of modifiedDates) {
    const scheduleRef = doc(db, 'courtSchedule', dateString)
    batch.set(scheduleRef, {
      schedule: existingSchedules.get(dateString),
      lastUpdated: serverTimestamp(),
      updatedBy: 'group-schedule-sync'
    }, { merge: true })
    opCount++
    if (opCount >= BATCH_LIMIT) await flushBatch()
  }

  await flushBatch()

  console.log(`✅ ${snapshot.docs.length} gelecek grup rezervasyonu silindi`)
}

function getDatesByDayOfWeek(dayName: string, startDate: Date, endDate: Date): Date[] {
  const dayMap: Record<string, number> = {
    Pazar: 0,
    Pazartesi: 1,
    Salı: 2,
    Çarşamba: 3,
    Perşembe: 4,
    Cuma: 5,
    Cumartesi: 6
  }

  const targetDay = dayMap[dayName]
  if (targetDay === undefined) return []

  const dates: Date[] = []
  const current = new Date(startDate)

  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }

  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }

  return dates
}

function getLessonDuration(membershipType: string): number {
  const durations: Record<string, number> = {
    private_1_45: 45,
    private_2_60: 60,
    private_group_3_8: 60,
    private_group_4_8: 60,
    adult_group: 60,
    tennis_school_age: 60,
    tennis_school_performance: 90
  }
  return durations[membershipType] || 60
}

/**
 * Create future group reservations for all members.
 * Uses writeBatch to avoid overwhelming Firestore with sequential operations.
 * Aggregates courtSchedule reads/writes per date (one read + one write per date).
 */
export async function createFutureGroupReservations(
  groupId: string,
  schedule: GroupScheduleSlot[],
  members: GroupMember[],
  membershipType: string,
  fromToday: boolean = false
): Promise<number> {
  const validMembers = members
    .filter(m => m?.id)
    .map(m => ({
      id: m.id,
      name: (m.name ?? `${(m as { firstName?: string; lastName?: string }).firstName ?? ''} ${(m as { firstName?: string; lastName?: string }).lastName ?? ''}`.trim()) || 'Üye'
    }))
    .filter(m => m.name)

  if (validMembers.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endWindow = new Date(today)
  endWindow.setMonth(today.getMonth() + RESERVATION_WINDOW_MONTHS)

  const lessonDuration = getLessonDuration(membershipType)

  // Phase 1: Collect all reservation data and courtSchedule slot updates in memory
  const pendingReservations: Array<{ data: Record<string, any> }> = []
  // dateString -> courtId -> time -> slot metadata
  const courtUpdates = new Map<string, Map<string, Map<string, Record<string, any>>>>()

  for (const slot of schedule) {
    if (!slot.day || !slot.time || !slot.court) continue

    const startDate = fromToday ? today : new Date(today)
    const dates = getDatesByDayOfWeek(slot.day, startDate, endWindow)

    for (const date of dates) {
      const dateString = date.toISOString().split('T')[0]
      const [startHour, startMinute] = slot.time.split(':').map(Number)

      const startDateTime = new Date(date)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(startDateTime)
      endDateTime.setMinutes(endDateTime.getMinutes() + lessonDuration)
      const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`

      for (const member of validMembers) {
        pendingReservations.push({
          data: {
            date: Timestamp.fromDate(startDateTime),
            courtId: slot.court,
            startTime: slot.time,
            endTime,
            groupId,
            studentId: member.id,
            studentName: member.name,
            groupAssignment: groupId,
            membershipType,
            reservationType: 'group-lesson',
            status: 'confirmed',
            type: 'lesson',
            groupSchedule: true,
            createdAt: serverTimestamp(),
            createdBy: 'group-schedule-sync'
          }
        })

        if (!courtUpdates.has(dateString)) courtUpdates.set(dateString, new Map())
        const dateMap = courtUpdates.get(dateString)!
        if (!dateMap.has(slot.court)) dateMap.set(slot.court, new Map())

        const nameParts = member.name.split(' ')
        dateMap.get(slot.court)!.set(slot.time, {
          status: 'occupied',
          studentId: member.id,
          studentFirstName: nameParts[0] ?? '',
          studentLastName: nameParts.slice(1).join(' ') ?? '',
          studentFullName: member.name,
          groupAssignment: groupId,
          membershipType,
          reservationType: 'group-lesson',
          updatedAt: serverTimestamp(),
          updatedBy: 'group-schedule-sync'
        })
      }
    }
  }

  if (pendingReservations.length === 0) return 0

  // Phase 2: Read all unique courtSchedule docs in parallel batches
  const dateStrings = [...courtUpdates.keys()]
  const existingSchedules = new Map<string, Record<string, any>>()

  for (let i = 0; i < dateStrings.length; i += READ_CONCURRENCY) {
    const chunk = dateStrings.slice(i, i + READ_CONCURRENCY)
    const snaps = await Promise.all(
      chunk.map(ds => getDoc(doc(db, 'courtSchedule', ds)))
    )
    snaps.forEach((snap, idx) => {
      existingSchedules.set(chunk[idx], snap.exists() ? snap.data()?.schedule || {} : {})
    })
  }

  // Phase 3: Apply all slot updates in memory (one merge per date)
  for (const [dateString, courts] of courtUpdates) {
    const scheduleData = existingSchedules.get(dateString) || {}
    for (const [courtId, times] of courts) {
      if (!scheduleData[courtId]) scheduleData[courtId] = {}
      for (const [time, slotData] of times) {
        scheduleData[courtId][time] = slotData
      }
    }
    existingSchedules.set(dateString, scheduleData)
  }

  // Phase 4: Batch write - reservations + courtSchedule updates
  let batch = writeBatch(db)
  let opCount = 0

  const flushBatch = async () => {
    if (opCount > 0) {
      await batch.commit()
      batch = writeBatch(db)
      opCount = 0
    }
  }

  for (const { data } of pendingReservations) {
    const resRef = doc(collection(db, 'reservations'))
    batch.set(resRef, data)
    opCount++
    if (opCount >= BATCH_LIMIT) await flushBatch()
  }

  for (const dateString of dateStrings) {
    const scheduleRef = doc(db, 'courtSchedule', dateString)
    batch.set(scheduleRef, {
      schedule: existingSchedules.get(dateString),
      lastUpdated: serverTimestamp()
    }, { merge: true })
    opCount++
    if (opCount >= BATCH_LIMIT) await flushBatch()
  }

  await flushBatch()

  console.log(`✅ ${pendingReservations.length} grup rezervasyonu oluşturuldu`)
  return pendingReservations.length
}

/**
 * Sync group schedule: update Group.schedule, reservations, courtSchedule, and all member profiles.
 * Single source of truth - ensures StudentManagement and GroupManagement stay in sync.
 *
 * @param groupId - Group document ID
 * @param newSchedule - Schedule slots (StudentManagement: day=monday, court=court-1 OR GroupManagement: day=Pazartesi, court=K1)
 * @param options - fromToday: only create future reservations from today (for profile updates)
 */
export async function syncGroupSchedule(
  groupId: string,
  newSchedule: ScheduleSlotBase[],
  options?: SyncGroupScheduleOptions
): Promise<void> {
  const normalizedSchedule = toGroupFormat(newSchedule)

  const groupRef = doc(db, 'groups', groupId)
  const groupSnap = await getDoc(groupRef)
  if (!groupSnap.exists()) {
    throw new Error(`Grup bulunamadı: ${groupId}`)
  }

  const groupData = groupSnap.data()
  const members: GroupMember[] = groupData.members || []
  const membershipType = options?.membershipType || groupData.membershipType || 'adult_group'
  const fromToday = options?.fromToday ?? false

  // 1. Update Group.schedule (single source of truth)
  await updateDoc(groupRef, {
    schedule: normalizedSchedule,
    updatedAt: serverTimestamp()
  })
  console.log('📋 Grup programı güncellendi')

  // 2. Delete future reservations
  await deleteFutureGroupReservations(groupId)

  // 3. Create new reservations (if schedule and members exist)
  if (normalizedSchedule.length > 0 && members.length > 0) {
    await createFutureGroupReservations(groupId, normalizedSchedule, members, membershipType, fromToday)
  }

  // 4. Update all members' groupSchedule.weeklyPlan (StudentManagement format for UI)
  const weeklyPlan = groupToStudentFormat(normalizedSchedule)
  const updatePromises = members.map((member) => {
    const studentRef = doc(db, 'users', member.id)
    return updateDoc(studentRef, {
      groupSchedule: { weeklyPlan },
      updatedAt: serverTimestamp()
    })
  })
  await Promise.all(updatePromises)
  console.log(`✅ ${members.length} öğrenci profili güncellendi`)
}
