import { describe, it, expect } from 'vitest'
import {
  DAY_LOCKS_COLLECTION,
  SAME_DAY_LIMIT_MESSAGE,
  dateKeyToUtcDate,
  dayLockId,
  isDayLockConflictError,
  isDayLockHeld,
  isValidDateKey,
} from '../../src/utils/reservationDayLock'
import { normalizeReservationDate } from '../../src/utils/dailyReservationLimit'

describe('reservationDayLock — günde-bir kuralının sunucu kilidi (saf yardımcılar)', () => {
  describe('isValidDateKey', () => {
    it('YYYY-MM-DD ve gerçek takvim günü → true', () => {
      expect(isValidDateKey('2026-09-17')).toBe(true)
      expect(isValidDateKey('2028-02-29')).toBe(true) // artık yıl
    })

    it('biçim dışı değerler → false', () => {
      expect(isValidDateKey('17.09.2026')).toBe(false)
      expect(isValidDateKey('2026-9-17')).toBe(false)
      expect(isValidDateKey('2026-09-17T10:00:00')).toBe(false)
      expect(isValidDateKey('')).toBe(false)
      expect(isValidDateKey(undefined)).toBe(false)
      expect(isValidDateKey(20260917)).toBe(false)
      expect(isValidDateKey(new Date(2026, 8, 17))).toBe(false)
    })

    it('takvimde olmayan gün → false (kilit kimliği sahte güne alınamasın)', () => {
      expect(isValidDateKey('2026-02-30')).toBe(false)
      expect(isValidDateKey('2027-02-29')).toBe(false)
      expect(isValidDateKey('2026-13-01')).toBe(false)
      expect(isValidDateKey('2026-00-10')).toBe(false)
    })
  })

  describe('dayLockId', () => {
    it('kural ile aynı birleştirme: {studentId}_{dateKey}', () => {
      expect(dayLockId('uid123', '2026-09-17')).toBe('uid123_2026-09-17')
    })

    it('aynı öğrenci farklı günler → farklı kilitler; aynı gün farklı öğrenciler → farklı kilitler', () => {
      expect(dayLockId('u1', '2026-09-17')).not.toBe(dayLockId('u1', '2026-09-18'))
      expect(dayLockId('u1', '2026-09-17')).not.toBe(dayLockId('u2', '2026-09-17'))
    })

    it('boş öğrenci ya da geçersiz tarih → hata (sessizce yanlış kilit üretilmez)', () => {
      expect(() => dayLockId('', '2026-09-17')).toThrow()
      expect(() => dayLockId('u1', '17.09.2026')).toThrow()
    })

    it('koleksiyon adı kurallarla aynı', () => {
      expect(DAY_LOCKS_COLLECTION).toBe('reservationDayLocks')
    })
  })

  describe('dateKeyToUtcDate', () => {
    it('formun eskiden yazdığı new Date(YYYY-MM-DD) ile birebir aynı değer', () => {
      expect(dateKeyToUtcDate('2026-09-17').getTime()).toBe(new Date('2026-09-17').getTime())
    })

    it('UTC gece yarısı (kuraldaki timestamp.date(y, m, d) paritesi)', () => {
      expect(dateKeyToUtcDate('2026-09-17').toISOString()).toBe('2026-09-17T00:00:00.000Z')
      expect(dateKeyToUtcDate('2026-01-01').toISOString()).toBe('2026-01-01T00:00:00.000Z')
    })

    it('okuyucular (normalizeReservationDate) aynı günü görür — UTC+3 kayması yok', () => {
      // Test ortamı saat dilimi ne olursa olsun, Timestamp benzeri değer
      // İstanbul'da (UTC+3) aynı güne düşer; UTC'de de öyle.
      const d = dateKeyToUtcDate('2026-09-17')
      const istanbulDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(d)
      expect(istanbulDay).toBe('2026-09-17')
      expect(normalizeReservationDate('2026-09-17')).toBe('2026-09-17')
    })

    it('geçersiz anahtar → hata', () => {
      expect(() => dateKeyToUtcDate('2026-02-30')).toThrow()
    })
  })

  describe('isDayLockHeld (kuraldaki isDayLockReleased tersinin paritesi)', () => {
    it('gösterilen rezervasyon yoksa kilit serbest', () => {
      expect(isDayLockHeld(null)).toBe(false)
      expect(isDayLockHeld(undefined)).toBe(false)
    })

    it('pending / confirmed → kilit TUTULUYOR', () => {
      expect(isDayLockHeld({ status: 'pending' })).toBe(true)
      expect(isDayLockHeld({ status: 'confirmed' })).toBe(true)
    })

    it('iptal/tamamlandı/gelmedi → kilit serbest (iptal sonrası aynı güne yeniden rezervasyon)', () => {
      expect(isDayLockHeld({ status: 'cancelled' })).toBe(false)
      expect(isDayLockHeld({ status: 'completed' })).toBe(false)
      expect(isDayLockHeld({ status: 'no_show' })).toBe(false)
    })

    it('statüsüz/bilinmeyen durum → serbest (hasActiveReservationOnDate de saymaz)', () => {
      expect(isDayLockHeld({})).toBe(false)
      expect(isDayLockHeld({ status: 'active' })).toBe(false)
    })
  })

  describe('isDayLockConflictError', () => {
    it('Firestore permission-denied → günde-bir reddi', () => {
      expect(isDayLockConflictError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' })).toBe(true)
    })

    it('diğer hatalar → false (genel hata mesajı gösterilir)', () => {
      expect(isDayLockConflictError({ code: 'unavailable' })).toBe(false)
      expect(isDayLockConflictError(new Error('network'))).toBe(false)
      expect(isDayLockConflictError(null)).toBe(false)
      expect(isDayLockConflictError(undefined)).toBe(false)
    })
  })

  it('mesaj, istemci ön kontrolünün gösterdiğiyle aynı', () => {
    expect(SAME_DAY_LIMIT_MESSAGE).toBe(
      'Aynı gün içinde yalnızca bir rezervasyon yapabilirsiniz. Lütfen farklı bir tarih seçin.'
    )
  })
})
