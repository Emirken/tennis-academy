import { describe, it, expect } from 'vitest'
import {
  hasActiveReservationOnDate,
  normalizeReservationDate,
  isLessonDoc,
  isSlotBlockingReservation,
  ACTIVE_RESERVATION_STATUSES,
  type RawReservationDoc,
} from '../../src/utils/dailyReservationLimit'

// Firestore Timestamp benzeri obje üretici (toDate() döndüren).
const fakeTimestamp = (d: Date) => ({ toDate: () => d })

describe('dailyReservationLimit — günde en fazla bir rezervasyon', () => {
  describe('normalizeReservationDate', () => {
    it('YYYY-MM-DD string olduğu gibi döner', () => {
      expect(normalizeReservationDate('2026-06-02')).toBe('2026-06-02')
    })

    it('saat içeren ISO string sadece tarih kısmını döner', () => {
      expect(normalizeReservationDate('2026-06-02T10:30:00')).toBe('2026-06-02')
    })

    it('Date nesnesini yerel YYYY-MM-DD\'ye çevirir', () => {
      // Yerel saatte 2 Haziran 2026 öğlen
      expect(normalizeReservationDate(new Date(2026, 5, 2, 12, 0, 0))).toBe('2026-06-02')
    })

    it('Firestore Timestamp (toDate) destekler', () => {
      expect(normalizeReservationDate(fakeTimestamp(new Date(2026, 5, 2, 9, 0)))).toBe('2026-06-02')
    })

    it('yerel gece yarısı tarihte UTC kayması yaşatmaz (UTC+ dilimi güvenliği)', () => {
      // new Date(2026, 5, 2, 0, 0) yerel gece yarısı — UTC'ye çevrilince önceki güne
      // kayabilir; util yerel bileşen kullandığı için 2026-06-02 kalmalı.
      expect(normalizeReservationDate(new Date(2026, 5, 2, 0, 0, 0))).toBe('2026-06-02')
    })

    it('geçersiz / boş değerler için null', () => {
      expect(normalizeReservationDate(null)).toBeNull()
      expect(normalizeReservationDate(undefined)).toBeNull()
      expect(normalizeReservationDate('not-a-date')).toBeNull()
    })
  })

  describe('hasActiveReservationOnDate', () => {
    const studentId = 'student_1'

    it('aynı gün aktif (pending) rezervasyon varsa true', () => {
      const docs: RawReservationDoc[] = [
        { studentId, status: 'pending', date: '2026-06-02' },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(true)
    })

    it('aynı gün confirmed rezervasyon varsa true', () => {
      const docs: RawReservationDoc[] = [
        { studentId, status: 'confirmed', date: fakeTimestamp(new Date(2026, 5, 2, 14, 0)) },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(true)
    })

    it('farklı gün rezervasyonu engellemez (false)', () => {
      const docs: RawReservationDoc[] = [
        { studentId, status: 'confirmed', date: '2026-06-03' },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(false)
    })

    it('iptal edilmiş (cancelled) rezervasyon günde-bir limitine sayılmaz', () => {
      const docs: RawReservationDoc[] = [
        { studentId, status: 'cancelled', date: '2026-06-02' },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(false)
    })

    it('no_show / completed gibi diğer durumlar da sayılmaz', () => {
      const docs: RawReservationDoc[] = [
        { studentId, status: 'no_show', date: '2026-06-02' },
        { studentId, status: 'completed', date: '2026-06-02' },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(false)
    })

    it('aynı gün GRUP DERSİ olması yeni rezervasyonu engellemez (ders ≠ rezervasyon)', () => {
      const docs: RawReservationDoc[] = [
        { studentId, status: 'confirmed', date: '2026-06-02', type: 'group-lesson', groupSchedule: true, groupId: 'grp_1' },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(false)
    })

    it('aynı gün ÖZEL DERS (private-lesson) olması yeni rezervasyonu engellemez', () => {
      const docs: RawReservationDoc[] = [
        { studentId, status: 'confirmed', date: '2026-06-02', type: 'private-lesson' },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(false)
    })

    it('dersi olan öğrenci aynı gün GERÇEK kort rezervasyonu yaparsa o sayılır', () => {
      const docs: RawReservationDoc[] = [
        // O gün bir dersi var (sayılmaz)
        { studentId, status: 'confirmed', date: '2026-06-02', type: 'group-lesson', groupSchedule: true },
        // Ve ayrıca kendi yaptığı bir kort rezervasyonu var (sayılır)
        { studentId, status: 'pending', date: '2026-06-02', type: 'court-rental' },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(true)
    })

    it('başka öğrencinin aynı gün rezervasyonu bu öğrenciyi engellemez', () => {
      const docs: RawReservationDoc[] = [
        { studentId: 'student_2', status: 'pending', date: '2026-06-02' },
      ]
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(false)
    })

    it('aynı öğrenci farklı günlerde rezervasyon yapabilir', () => {
      const docs: RawReservationDoc[] = [
        { studentId, status: 'confirmed', date: '2026-06-02' },
        { studentId, status: 'pending', date: '2026-06-04' },
      ]
      // 3 Haziran boş — izin verilir
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-03')).toBe(false)
      // 2 ve 4 Haziran dolu — engellenir
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-02')).toBe(true)
      expect(hasActiveReservationOnDate(docs, studentId, '2026-06-04')).toBe(true)
    })

    it('boş liste / boş studentId / boş tarih güvenli şekilde false', () => {
      expect(hasActiveReservationOnDate([], studentId, '2026-06-02')).toBe(false)
      expect(hasActiveReservationOnDate([{ studentId, status: 'pending', date: '2026-06-02' }], '', '2026-06-02')).toBe(false)
      expect(hasActiveReservationOnDate([{ studentId, status: 'pending', date: '2026-06-02' }], studentId, '')).toBe(false)
    })
  })

  describe('isLessonDoc — ders / rezervasyon ayrımı', () => {
    it('type group-lesson ders sayılır', () => {
      expect(isLessonDoc({ type: 'group-lesson' })).toBe(true)
    })

    it('type private-lesson (özel ders) ders sayılır', () => {
      expect(isLessonDoc({ type: 'private-lesson' })).toBe(true)
    })

    it('reservationType group-lesson ders sayılır', () => {
      expect(isLessonDoc({ reservationType: 'group-lesson' })).toBe(true)
    })

    it('groupSchedule === true ders sayılır', () => {
      expect(isLessonDoc({ groupSchedule: true })).toBe(true)
    })

    it('groupId dolu ise ders sayılır', () => {
      expect(isLessonDoc({ groupId: 'grp_1' })).toBe(true)
    })

    it('groupAssignment dolu ise ders sayılır', () => {
      expect(isLessonDoc({ groupAssignment: 'grp_1' })).toBe(true)
    })

    it('court-rental (öğrencinin kendi rezervasyonu) ders DEĞİLDİR', () => {
      expect(isLessonDoc({ type: 'court-rental', status: 'pending' })).toBe(false)
    })

    it('hiçbir ders işareti olmayan doküman ders değildir', () => {
      expect(isLessonDoc({ studentId: 's1', status: 'confirmed', date: '2026-06-02' })).toBe(false)
    })

    it('boş groupId/groupAssignment ders saymaz', () => {
      expect(isLessonDoc({ type: 'court-rental', groupId: '', groupAssignment: '' })).toBe(false)
    })
  })

  describe('sabitler', () => {
    it('aktif durumlar pending ve confirmed', () => {
      expect(ACTIVE_RESERVATION_STATUSES).toEqual(['pending', 'confirmed'])
    })
  })

  // Tüm modüllerin (takvim, /courts, rezervasyon formu) ortak doluluk ölçütü.
  // Bu küme tutarsız olduğunda "takvimde dolu ama rezervasyonda boş" hatası
  // oluşur — bu testler kümeyi sabitler.
  describe('isSlotBlockingReservation — ortak doluluk ölçütü', () => {
    it('pending slotu DOLU tutar', () => {
      expect(isSlotBlockingReservation({ status: 'pending' })).toBe(true)
    })

    it('confirmed slotu DOLU tutar', () => {
      expect(isSlotBlockingReservation({ status: 'confirmed' })).toBe(true)
    })

    it('active slotu DOLU tutar', () => {
      expect(isSlotBlockingReservation({ status: 'active' })).toBe(true)
    })

    it('status alanı OLMAYAN (legacy/elle eklenen) doküman DOLU sayılır', () => {
      expect(isSlotBlockingReservation({ courtId: 'K1', startTime: '18:00' })).toBe(true)
    })

    it('boş string status DOLU sayılır', () => {
      expect(isSlotBlockingReservation({ status: '' })).toBe(true)
    })

    it('cancelled slotu BOŞ bırakır', () => {
      expect(isSlotBlockingReservation({ status: 'cancelled' })).toBe(false)
    })

    it('completed slotu BOŞ bırakır', () => {
      expect(isSlotBlockingReservation({ status: 'completed' })).toBe(false)
    })

    it('no_show slotu BOŞ bırakır', () => {
      expect(isSlotBlockingReservation({ status: 'no_show' })).toBe(false)
    })

    it('bilinmeyen status güvenli tarafta DOLU sayılır (takvimle tutarlı)', () => {
      expect(isSlotBlockingReservation({ status: 'weird_status' })).toBe(true)
    })

    it('gerçek senaryo: grup dersi (confirmed, group-lesson) slotu DOLU tutar', () => {
      expect(
        isSlotBlockingReservation({
          status: 'confirmed',
          reservationType: 'group-lesson',
          groupId: 'grp_1',
        }),
      ).toBe(true)
    })
  })
})
