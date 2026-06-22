import { describe, it, expect } from 'vitest'
import { needsParentInfo, PARENT_REQUIRED_MEMBERSHIPS } from '@/utils/parentInfo'

describe('needsParentInfo', () => {
  it('veli bilgisi gerektiren 4 üyelik türü için true döner', () => {
    expect(needsParentInfo('tennis_school_age')).toBe(true)
    expect(needsParentInfo('premium')).toBe(true)
    expect(needsParentInfo('vip')).toBe(true)
    expect(needsParentInfo('court_rental_equipment')).toBe(true)
  })

  it('diğer üyelik türleri için false döner', () => {
    expect(needsParentInfo('basic')).toBe(false)
    expect(needsParentInfo('adult_group')).toBe(false)
    expect(needsParentInfo('private_1_45')).toBe(false)
    expect(needsParentInfo('court_rental_1h')).toBe(false)
  })

  it('boş / undefined / null için false döner', () => {
    expect(needsParentInfo('')).toBe(false)
    expect(needsParentInfo(undefined)).toBe(false)
    expect(needsParentInfo(null)).toBe(false)
  })

  it('sabit listesi tam olarak 4 türü içerir', () => {
    expect([...PARENT_REQUIRED_MEMBERSHIPS]).toEqual([
      'tennis_school_age',
      'premium',
      'vip',
      'court_rental_equipment',
    ])
  })
})
