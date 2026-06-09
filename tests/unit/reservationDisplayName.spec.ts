import { describe, it, expect } from 'vitest'
import { resolveStudentDisplay } from '@/utils/reservationDisplayName'

describe('resolveStudentDisplay — private ders ad/telefon çözümü', () => {
  it('1) taze isim varsa onu kullanır; first/last/fullName/name yok sayılır', () => {
    const result = resolveStudentDisplay(
      {
        studentId: 'u1',
        studentFirstName: 'Ali',
        studentLastName: 'Veli',
        studentFullName: 'Tam Ad',
        studentName: 'Eski Ad',
      },
      { u1: 'Taze İsim' },
      {},
    )
    expect(result.displayName).toBe('Taze İsim')
  })

  it('2) taze isim yok ama firstName + lastName var → "First Last"', () => {
    const result = resolveStudentDisplay(
      {
        studentId: 'u2',
        studentFirstName: 'Ali',
        studentLastName: 'Veli',
      },
      {},
      {},
    )
    expect(result.displayName).toBe('Ali Veli')
  })

  it('3) sadece studentFullName var → o değer', () => {
    const result = resolveStudentDisplay(
      { studentFullName: 'Ayşe Yılmaz' },
      {},
      {},
    )
    expect(result.displayName).toBe('Ayşe Yılmaz')
  })

  it('4) sadece studentName var → o değer', () => {
    const result = resolveStudentDisplay(
      { studentName: 'Mehmet Demir' },
      {},
      {},
    )
    expect(result.displayName).toBe('Mehmet Demir')
  })

  it('5) hiçbiri yok → "Bilinmiyor"', () => {
    const result = resolveStudentDisplay({}, {}, {})
    expect(result.displayName).toBe('Bilinmiyor')
  })

  describe('6) telefon önceliği', () => {
    it('taze telefon varsa onu döner (contactPhone yok sayılır)', () => {
      const result = resolveStudentDisplay(
        { studentId: 'u6', contactPhone: '05550000000' },
        {},
        { u6: '05551112233' },
      )
      expect(result.phone).toBe('05551112233')
    })

    it('studentId yok ama contactPhone var → contactPhone döner', () => {
      const result = resolveStudentDisplay(
        { contactPhone: '05554445566' },
        {},
        {},
      )
      expect(result.phone).toBe('05554445566')
    })

    it('studentId var, taze telefon yok, contactPhone var → contactPhone döner', () => {
      const result = resolveStudentDisplay(
        { studentId: 'u7', contactPhone: '05557778899' },
        {},
        {},
      )
      expect(result.phone).toBe('05557778899')
    })

    it('hiçbir telefon yok → boş string', () => {
      const result = resolveStudentDisplay({ studentId: 'u8' }, {}, {})
      expect(result.phone).toBe('')
    })
  })

  it('döndürülen nesne { displayName, phone } alanlarını içerir', () => {
    const result = resolveStudentDisplay(
      { studentName: 'Test', contactPhone: '05550001122' },
      {},
      {},
    )
    expect(result).toEqual({ displayName: 'Test', phone: '05550001122' })
  })
})
