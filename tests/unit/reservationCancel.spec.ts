import { describe, it, expect } from 'vitest'
import {
  getReservationIdsToCancel,
  type CancelTarget,
  type RawReservationDocWithId,
} from '../../src/utils/reservationCancel'

const fakeTimestamp = (d: Date) => ({ toDate: () => d })

describe('getReservationIdsToCancel — admin rezervasyon iptali', () => {
  describe('bireysel rezervasyon', () => {
    it('grup yoksa yalnızca hedef dokümanı iptal eder', () => {
      const docs: RawReservationDocWithId[] = [
        { id: 'r1', status: 'confirmed', studentId: 's1', startTime: '09:00', courtId: 'court-1' },
        { id: 'r2', status: 'confirmed', studentId: 's2', startTime: '09:00', courtId: 'court-2' },
      ]
      const target: CancelTarget = { reservationId: 'r1' }
      expect(getReservationIdsToCancel(target, docs)).toEqual(['r1'])
    })

    it('groupId null verilse de bireysel davranır', () => {
      const docs: RawReservationDocWithId[] = [
        { id: 'r1', status: 'pending', startTime: '10:00', courtId: 'K1' },
      ]
      const target: CancelTarget = { reservationId: 'r1', groupId: null }
      expect(getReservationIdsToCancel(target, docs)).toEqual(['r1'])
    })
  })

  describe('grup dersi — tüm üyeleri iptal et', () => {
    const date = fakeTimestamp(new Date(2026, 5, 2, 0, 0))
    const baseDocs: RawReservationDocWithId[] = [
      // Aynı grup+tarih+saat+kort: hepsi iptal edilmeli
      { id: 'g1', status: 'confirmed', groupId: 'grpA', date, startTime: '09:00', courtId: 'court-1', studentId: 's1' },
      { id: 'g2', status: 'confirmed', groupId: 'grpA', date, startTime: '09:00', courtId: 'court-1', studentId: 's2' },
      { id: 'g3', status: 'pending', groupId: 'grpA', date, startTime: '09:00', courtId: 'court-1', studentId: 's3' },
      // Farklı saat — iptal EDİLMEMELİ
      { id: 'g4', status: 'confirmed', groupId: 'grpA', date, startTime: '10:00', courtId: 'court-1', studentId: 's4' },
      // Farklı kort — iptal EDİLMEMELİ
      { id: 'g5', status: 'confirmed', groupId: 'grpA', date, startTime: '09:00', courtId: 'court-2', studentId: 's5' },
      // Farklı grup — iptal EDİLMEMELİ
      { id: 'g6', status: 'confirmed', groupId: 'grpB', date, startTime: '09:00', courtId: 'court-1', studentId: 's6' },
      // Zaten iptal — tekrar iptal EDİLMEMELİ (slotu meşgul etmiyor)
      { id: 'g7', status: 'cancelled', groupId: 'grpA', date, startTime: '09:00', courtId: 'court-1', studentId: 's7' },
    ]

    it('aynı grup+tarih+saat+kort tüm aktif üyeleri iptal eder', () => {
      const target: CancelTarget = {
        reservationId: 'g1',
        groupId: 'grpA',
        date,
        startTime: '09:00',
        courtId: 'court-1',
      }
      const result = getReservationIdsToCancel(target, baseDocs)
      expect(result).toContain('g1')
      expect(result).toContain('g2')
      expect(result).toContain('g3')
      expect(result).not.toContain('g4') // farklı saat
      expect(result).not.toContain('g5') // farklı kort
      expect(result).not.toContain('g6') // farklı grup
      expect(result).not.toContain('g7') // zaten iptal
      expect(result).toHaveLength(3)
    })

    it('hedef id daima ilk sırada ve listede yer alır', () => {
      const target: CancelTarget = {
        reservationId: 'g2',
        groupId: 'grpA',
        date,
        startTime: '09:00',
        courtId: 'court-1',
      }
      const result = getReservationIdsToCancel(target, baseDocs)
      expect(result[0]).toBe('g2')
      expect(result).toContain('g1')
      expect(result).toContain('g3')
    })

    it('kort id farklı yazımları (court-1 vs K1) eşleşmez ise sadece tam eşleşeni alır', () => {
      // groupAssignment alanı da groupId gibi çalışmalı
      const docs: RawReservationDocWithId[] = [
        { id: 'a1', status: 'confirmed', groupAssignment: 'grpX', date, startTime: '08:00', courtId: 'court-3' },
        { id: 'a2', status: 'confirmed', groupAssignment: 'grpX', date, startTime: '08:00', courtId: 'court-3' },
      ]
      const target: CancelTarget = {
        reservationId: 'a1',
        groupId: 'grpX',
        date,
        startTime: '08:00',
        courtId: 'court-3',
      }
      const result = getReservationIdsToCancel(target, docs)
      expect(result.sort()).toEqual(['a1', 'a2'])
    })

    it('status\'suz (legacy) grup üyesi de iptal edilir (slotu meşgul sayılır)', () => {
      const docs: RawReservationDocWithId[] = [
        { id: 'g1', status: 'confirmed', groupId: 'grpA', date, startTime: '09:00', courtId: 'court-1' },
        { id: 'g2', groupId: 'grpA', date, startTime: '09:00', courtId: 'court-1' }, // status yok
      ]
      const target: CancelTarget = {
        reservationId: 'g1',
        groupId: 'grpA',
        date,
        startTime: '09:00',
        courtId: 'court-1',
      }
      expect(getReservationIdsToCancel(target, docs).sort()).toEqual(['g1', 'g2'])
    })
  })
})
