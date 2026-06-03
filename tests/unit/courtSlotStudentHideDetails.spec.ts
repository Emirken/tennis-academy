import { describe, it, expect } from 'vitest'

// Courts.vue içindeki getStudentInfo fonksiyonunun saf izole versiyonu.
// Yeni davranış: öğrenci panelinde hangi dersin/grubun olduğu kesinlikle
// görünmesin; sadece "Dolu" (yani null detay) dönmeli. Admin tüm detayları
// görmeye devam etsin.

interface SlotData {
  status?: string
  reservationType?: string
  membershipType?: string
  groupAssignment?: string
  groupName?: string
  studentFirstName?: string
  studentLastName?: string
  studentFullName?: string
}

const getMembershipDisplayName = (type: string) => {
  if (!type) return ''
  const map: Record<string, string> = {
    adult_group: 'Yetişkin Grup',
    private_1_45: 'Özel Ders',
  }
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const getGroupDisplayName = (groupAssignment: string): string | null => {
  if (!groupAssignment) return null
  const groupLabels: Record<string, string> = {
    group_1: 'Grup 1',
    group_2: 'Grup 2',
  }
  return groupLabels[groupAssignment] || null
}

// Courts.vue:445-491 ile birebir eşleşen mantık
function getStudentInfo(slotData: SlotData | null | undefined, isAdmin: boolean): string | null {
  if (!slotData || typeof slotData !== 'object') return null

  const status = slotData.status || 'available'
  if (status !== 'occupied') return null

  // Öğrenciler için hiçbir ders detayı gösterilmez; yalnızca "Dolu" görünür
  if (!isAdmin) {
    return null
  }

  const isGroupLesson = slotData.reservationType === 'group-lesson' ||
      slotData.membershipType?.includes('_group_') ||
      !!slotData.groupAssignment

  if (isGroupLesson) {
    const membershipLabel = getMembershipDisplayName(slotData.membershipType || '')
    const groupLabel = slotData.groupName || getGroupDisplayName(slotData.groupAssignment || '')
    if (membershipLabel && groupLabel) return `${membershipLabel} - ${groupLabel}`
    if (membershipLabel) return membershipLabel
    if (groupLabel) return `Grup Dersi - ${groupLabel}`
  }

  if (slotData.studentFirstName && slotData.studentLastName) {
    return `${slotData.studentFirstName} ${slotData.studentLastName}`
  }
  if (slotData.studentFullName) return slotData.studentFullName
  return null
}

describe('öğrenci panelinde kort slot detayları gizli', () => {
  const adultGroupSlot: SlotData = {
    status: 'occupied',
    reservationType: 'group-lesson',
    membershipType: 'adult_group',
    groupAssignment: 'xzcasda',
    groupName: 'Sabah Grubu',
    studentFullName: 'Ali Yılmaz',
  }

  const kidsGroupSlot: SlotData = {
    status: 'occupied',
    reservationType: 'group-lesson',
    membershipType: 'kids_group_1',
    groupAssignment: 'group_1',
    groupName: 'Çocuk Grubu A',
  }

  const privateSlot: SlotData = {
    status: 'occupied',
    reservationType: 'lesson',
    membershipType: 'private_1_45',
    studentFirstName: 'Ali',
    studentLastName: 'Yılmaz',
    studentFullName: 'Ali Yılmaz',
  }

  it('yetişkin grup dersi öğrenciye gösterilmez', () => {
    expect(getStudentInfo(adultGroupSlot, false)).toBeNull()
  })

  it('çocuk grup dersi öğrenciye gösterilmez', () => {
    expect(getStudentInfo(kidsGroupSlot, false)).toBeNull()
  })

  it('özel ders öğrenciye gösterilmez', () => {
    expect(getStudentInfo(privateSlot, false)).toBeNull()
  })

  it('available slot her durumda null döner', () => {
    expect(getStudentInfo({ status: 'available' }, true)).toBeNull()
    expect(getStudentInfo({ status: 'available' }, false)).toBeNull()
  })

  it('admin yetişkin grup için üyelik + grup adı görür', () => {
    expect(getStudentInfo(adultGroupSlot, true)).toBe('Yetişkin Grup - Sabah Grubu')
  })

  it('admin çocuk grup dersi için detay görür', () => {
    expect(getStudentInfo(kidsGroupSlot, true)).toBe('Kids Group 1 - Çocuk Grubu A')
  })

  it('admin özel ders için öğrenci adını görür', () => {
    expect(getStudentInfo(privateSlot, true)).toBe('Ali Yılmaz')
  })
})
