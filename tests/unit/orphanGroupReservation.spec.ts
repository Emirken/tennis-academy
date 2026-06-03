import { describe, it, expect } from 'vitest'
import {
  getReservationGroupId,
  isOrphanGroupReservation,
  type RawReservationDoc,
} from '../../src/utils/dailyReservationLimit'

describe('Hayalet (yetim) grup rezervasyonu tespiti', () => {
  describe('getReservationGroupId', () => {
    it('groupId varsa onu döner', () => {
      expect(getReservationGroupId({ groupId: 'G1' })).toBe('G1')
    })

    it('groupId yoksa groupAssignment kullanılır', () => {
      expect(getReservationGroupId({ groupAssignment: 'G2' })).toBe('G2')
    })

    it('groupId öncelikli (her ikisi varsa)', () => {
      expect(getReservationGroupId({ groupId: 'G1', groupAssignment: 'G2' })).toBe('G1')
    })

    it('grup alanı yoksa null', () => {
      expect(getReservationGroupId({ studentId: 's1' })).toBeNull()
    })

    it('boş string null sayılır', () => {
      expect(getReservationGroupId({ groupId: '   ' })).toBeNull()
      expect(getReservationGroupId({ groupId: '' })).toBeNull()
    })

    it('string olmayan grup değeri null', () => {
      expect(getReservationGroupId({ groupId: 123 as unknown as string })).toBeNull()
    })
  })

  describe('isOrphanGroupReservation', () => {
    const existing = new Set(['VAR_GRUP'])

    it('grubu silinmiş rezervasyon yetim sayılır', () => {
      const doc: RawReservationDoc = {
        courtId: 'K3',
        groupId: 'SILINMIS_GRUP',
        status: 'confirmed',
        reservationType: 'group-lesson',
      }
      expect(isOrphanGroupReservation(doc, existing)).toBe(true)
    })

    it('grubu hâlâ var olan rezervasyon yetim DEĞİL', () => {
      const doc: RawReservationDoc = { courtId: 'K3', groupId: 'VAR_GRUP', status: 'confirmed' }
      expect(isOrphanGroupReservation(doc, existing)).toBe(false)
    })

    it('hiç grubu olmayan (kişisel kort) rezervasyon yetim DEĞİL', () => {
      const doc: RawReservationDoc = { courtId: 'court-3', type: 'court-rental', status: 'pending' }
      expect(isOrphanGroupReservation(doc, existing)).toBe(false)
    })

    it('groupAssignment ile bağlı silinmiş grup da yetim sayılır', () => {
      const doc: RawReservationDoc = { courtId: 'K3', groupAssignment: 'SILINMIS_GRUP' }
      expect(isOrphanGroupReservation(doc, existing)).toBe(true)
    })

    it('var olan grup kümesi boşsa, gruplu her kayıt yetim sayılır', () => {
      const doc: RawReservationDoc = { courtId: 'K3', groupId: 'HERHANGI' }
      expect(isOrphanGroupReservation(doc, new Set())).toBe(true)
    })
  })

  describe('gerçek senaryo: 3 Haziran Kort 3 — grup AkZrRHZYt3CnkZpcKiSx silinmiş', () => {
    // Veritabanında bulunan gerçek kayıt deseni (group-schedule-sync üretimi)
    const ghostDoc: RawReservationDoc = {
      courtId: 'K3',
      date: '2026-06-03T14:00:00Z',
      startTime: '17:00',
      endTime: '18:00',
      status: 'confirmed',
      reservationType: 'group-lesson',
      groupId: 'AkZrRHZYt3CnkZpcKiSx',
      groupSchedule: true,
      studentName: 'Lena Engin',
    }

    it('grup artık yoksa bu slot doluluk hesabına KATILMAZ', () => {
      const existingGroups = new Set(['BASKA_GRUP']) // AkZr... yok
      expect(isOrphanGroupReservation(ghostDoc, existingGroups)).toBe(true)
    })

    it('grup geri eklenirse slot tekrar dolu sayılır', () => {
      const existingGroups = new Set(['AkZrRHZYt3CnkZpcKiSx'])
      expect(isOrphanGroupReservation(ghostDoc, existingGroups)).toBe(false)
    })
  })
})
