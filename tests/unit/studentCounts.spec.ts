import { describe, it, expect } from 'vitest'
import {
  computeStudentCounts,
  isActiveStudent,
} from '@/utils/studentCounts'

describe('studentCounts — aktif vs toplam öğrenci sayımı', () => {
  it("aktif öğrenci 'active' veya 'approved' durumudur", () => {
    expect(isActiveStudent({ status: 'active' })).toBe(true)
    expect(isActiveStudent({ status: 'approved' })).toBe(true)
    expect(isActiveStudent({ status: 'pending' })).toBe(false)
    expect(isActiveStudent({ status: 'inactive' })).toBe(false)
    expect(isActiveStudent({ status: 'suspended' })).toBe(false)
    expect(isActiveStudent({})).toBe(false)
  })

  it('silinmiş öğrenciler hiçbir sayıya dahil edilmez', () => {
    const counts = computeStudentCounts([
      { status: 'active', deleted: true },
      { status: 'active' },
    ])
    expect(counts).toEqual({ total: 1, active: 1 })
  })

  it('toplam = silinmemiş tüm öğrenciler, aktif = aktif/onaylı olanlar', () => {
    const counts = computeStudentCounts([
      { status: 'active' },
      { status: 'approved' },
      { status: 'pending' },
      { status: 'inactive' },
      { status: 'suspended' },
      { status: undefined },
    ])
    expect(counts.total).toBe(6)
    expect(counts.active).toBe(2)
  })

  it('boş liste sıfır döner', () => {
    expect(computeStudentCounts([])).toEqual({ total: 0, active: 0 })
  })

  it('aktif sayısı toplamı asla geçemez', () => {
    const counts = computeStudentCounts([
      { status: 'active', deleted: true },
      { status: 'pending' },
      { status: 'approved' },
    ])
    expect(counts.active).toBeLessThanOrEqual(counts.total)
    expect(counts).toEqual({ total: 2, active: 1 })
  })
})
