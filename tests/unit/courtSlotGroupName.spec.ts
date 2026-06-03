import { describe, it, expect } from 'vitest'

// Courts.vue içindeki getStudentInfo fonksiyonunun saf izole versiyonu.
// Davranış güncellemesi: öğrenci panelinde hiçbir ders/grup detayı görünmez
// (sadece "Dolu" yazısı kullanıcıya gösterilir). Admin tüm detayları görür.

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

function getStudentInfo(slotData: SlotData | null | undefined, isAdmin: boolean): string | null {
  if (!slotData || typeof slotData !== 'object') return null

  const status = slotData.status || 'available'
  if (status !== 'occupied') return null

  if (!isAdmin) return null

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

describe('court slot group name display', () => {
  const adultGroupSlot: SlotData = {
    status: 'occupied',
    reservationType: 'group-lesson',
    membershipType: 'adult_group',
    groupAssignment: 'xzcasda',
    groupName: 'Sabah Grubu',
    studentFullName: 'Ali Yılmaz',
  }

  it('öğrenciye yetişkin grup adı gösterilmez (gizlilik güncellemesi)', () => {
    expect(getStudentInfo(adultGroupSlot, false)).toBeNull()
  })

  it('admine yetişkin grup üyelik tipi + grup adı görünür (id görünmez)', () => {
    expect(getStudentInfo(adultGroupSlot, true)).toBe('Yetişkin Grup - Sabah Grubu')
  })

  it('groupName yoksa ve id sabit etiketle eşleşmiyorsa adminde ham id görünmez', () => {
    const slotNoName: SlotData = { ...adultGroupSlot, groupName: undefined }
    expect(getStudentInfo(slotNoName, true)).toBe('Yetişkin Grup')
  })

  it('groupName olsa bile öğrenciye yetişkin grup için bir şey görünmez', () => {
    expect(getStudentInfo(adultGroupSlot, false)).toBeNull()
  })

  it('özel ders öğrenciye gizli, admine isim soyisim olarak görünür (regresyon)', () => {
    const privateSlot: SlotData = {
      status: 'occupied',
      reservationType: 'lesson',
      membershipType: 'private_1_45',
      studentFirstName: 'Ali',
      studentLastName: 'Yılmaz',
      studentFullName: 'Ali Yılmaz',
    }
    expect(getStudentInfo(privateSlot, false)).toBeNull()
    expect(getStudentInfo(privateSlot, true)).toBe('Ali Yılmaz')
  })

  it('available slot için her zaman null döner (regresyon)', () => {
    expect(getStudentInfo({ status: 'available' }, true)).toBeNull()
    expect(getStudentInfo({ status: 'available' }, false)).toBeNull()
  })
})
