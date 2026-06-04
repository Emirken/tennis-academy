import { describe, it, expect } from 'vitest'
import { resolveGroupExitOnSave } from '@/utils/studentGroupExit'

// Grup türü sayılan üyelik anahtarları (membershipTypesStore.isGroupType taklidi)
const GROUP_TYPES = ['adult_group', 'private_group_3_8', 'tennis_school_age']
const isGroupMembership = (t?: string | null) => GROUP_TYPES.includes(t ?? '')

describe('resolveGroupExitOnSave — grup öğrencisi pasife alınınca gruptan çıkarma', () => {
  it('grup öğrencisi pasife alınınca: basic, grup yok, çıkarılıyor', () => {
    const d = resolveGroupExitOnSave({
      oldMembershipType: 'adult_group',
      oldGroupAssignment: 'group-1',
      formMembershipType: 'adult_group',
      formGroupAssignment: 'group-1',
      newStatus: 'inactive',
    }, isGroupMembership)

    expect(d.goingPassiveFromGroup).toBe(true)
    expect(d.effectiveMembershipType).toBe('basic')
    expect(d.effectiveGroupAssignment).toBeNull()
    expect(d.groupBeingRemoved).toBe(true)
  })

  it('grup öğrencisi aktif kalıyorsa (değişiklik yok): grupta kalır', () => {
    const d = resolveGroupExitOnSave({
      oldMembershipType: 'adult_group',
      oldGroupAssignment: 'group-1',
      formMembershipType: 'adult_group',
      formGroupAssignment: 'group-1',
      newStatus: 'active',
    }, isGroupMembership)

    expect(d.goingPassiveFromGroup).toBe(false)
    expect(d.effectiveMembershipType).toBe('adult_group')
    expect(d.effectiveGroupAssignment).toBe('group-1')
    expect(d.groupBeingRemoved).toBe(false)
  })

  it('basic öğrenci pasife alınınca: grup mantığı no-op', () => {
    const d = resolveGroupExitOnSave({
      oldMembershipType: 'basic',
      oldGroupAssignment: null,
      formMembershipType: 'basic',
      formGroupAssignment: '',
      newStatus: 'inactive',
    }, isGroupMembership)

    expect(d.goingPassiveFromGroup).toBe(false)
    expect(d.effectiveMembershipType).toBe('basic')
    expect(d.effectiveGroupAssignment).toBeNull()
    expect(d.groupBeingRemoved).toBe(false)
  })

  it('özel ders öğrencisi pasife alınınca: grup mantığı no-op, tür korunur', () => {
    const d = resolveGroupExitOnSave({
      oldMembershipType: 'private_1_45',
      oldGroupAssignment: null,
      formMembershipType: 'private_1_45',
      formGroupAssignment: '',
      newStatus: 'inactive',
    }, isGroupMembership)

    expect(d.goingPassiveFromGroup).toBe(false)
    expect(d.effectiveMembershipType).toBe('private_1_45')
    expect(d.effectiveGroupAssignment).toBeNull()
    expect(d.groupBeingRemoved).toBe(false)
  })

  it('aktifken grup değişimi (eski id ≠ yeni id): normal değişim akışı bozulmaz', () => {
    const d = resolveGroupExitOnSave({
      oldMembershipType: 'adult_group',
      oldGroupAssignment: 'group-1',
      formMembershipType: 'adult_group',
      formGroupAssignment: 'group-2',
      newStatus: 'active',
    }, isGroupMembership)

    expect(d.goingPassiveFromGroup).toBe(false)
    expect(d.effectiveGroupAssignment).toBe('group-2')
    // groupAssignment değişiyor ama gruptan çıkma değil (yeni grup atanıyor)
    expect(d.groupBeingRemoved).toBe(false)
  })

  it('zaten inactive + grup alanları dolu yeniden kaydedilirse: kendiliğinden onarır (idempotent)', () => {
    const d = resolveGroupExitOnSave({
      oldMembershipType: 'private_group_3_8',
      oldGroupAssignment: 'group-9',
      formMembershipType: 'private_group_3_8',
      formGroupAssignment: 'group-9',
      newStatus: 'inactive',
    }, isGroupMembership)

    expect(d.goingPassiveFromGroup).toBe(true)
    expect(d.effectiveMembershipType).toBe('basic')
    expect(d.effectiveGroupAssignment).toBeNull()
    expect(d.groupBeingRemoved).toBe(true)
  })

  it('pasif + yeni grup seçimi aynı kayıtta: pasif kazanır (grup atanmaz)', () => {
    const d = resolveGroupExitOnSave({
      oldMembershipType: 'adult_group',
      oldGroupAssignment: 'group-1',
      formMembershipType: 'adult_group',
      formGroupAssignment: 'group-2',
      newStatus: 'inactive',
    }, isGroupMembership)

    expect(d.goingPassiveFromGroup).toBe(true)
    expect(d.effectiveGroupAssignment).toBeNull()
    expect(d.groupBeingRemoved).toBe(true)
  })
})
