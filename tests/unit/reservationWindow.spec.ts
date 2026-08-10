import { describe, it, expect } from 'vitest'
import {
  getOpenReservationRange,
  getOpenReservationDate,
  isReservationDateOpen,
  getNextOpenAt,
  RESERVATION_OPEN_HOUR,
  RESERVATION_OPEN_WEEKDAY,
} from '../../src/utils/reservationWindow'

// Yerel saatte belirli bir an. Date(Y, M-1, D, h, m) -> yerel saat.
const localDate = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min, 0, 0)

describe('reservationWindow (haftalık Pazartesi 13:00)', () => {
  describe('sabitler', () => {
    it('açılma saati 13:00', () => {
      expect(RESERVATION_OPEN_HOUR).toBe(13)
    })
    it('açılma günü Pazartesi (getDay === 1)', () => {
      expect(RESERVATION_OPEN_WEEKDAY).toBe(1)
      expect(localDate(2026, 6, 1).getDay()).toBe(1) // sanity: 1 Haz 2026 Pazartesi
    })
  })

  describe('getOpenReservationRange — temel senaryo', () => {
    it('Pazartesi 1 Haz 2026 @ 13:00 → Pzt 1 Haz – Paz 7 Haz (açılış günü DAHİL)', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 1, 13, 0))
      expect(r).toEqual({ start: '2026-06-01', end: '2026-06-07' })
    })

    it('Pazartesi 1 Haz 2026 @ 12:59 → henüz açılmadı (kapalı)', () => {
      expect(getOpenReservationRange(localDate(2026, 6, 1, 12, 59))).toBeNull()
    })

    it('Pazartesi 1 Haz 2026 @ 00:00 → kapalı', () => {
      expect(getOpenReservationRange(localDate(2026, 6, 1, 0, 0))).toBeNull()
    })

    it('Çarşamba 3 Haz 2026 (hafta ortası) → o haftanın penceresi 1–7 Haz', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 3, 12, 0))
      expect(r).toEqual({ start: '2026-06-01', end: '2026-06-07' })
    })

    it('Pazar 7 Haz 2026 @ 23:00 → hâlâ açık (1–7 Haz, son gün son slota kadar)', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 7, 23, 0))
      expect(r).toEqual({ start: '2026-06-01', end: '2026-06-07' })
    })

    it('Pazartesi 8 Haz 2026 @ 13:00 → yeni haftaya kayar (8–14 Haz)', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 8, 13, 0))
      expect(r).toEqual({ start: '2026-06-08', end: '2026-06-14' })
    })
  })

  describe('ay/yıl sınırı', () => {
    it('ay geçişi: Pazartesi 1 Haz @ 13:00 → Haziran ayına açılır', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 1, 13, 0))
      expect(r?.start).toBe('2026-06-01')
    })

    it('yıl geçişi: Pazartesi 28 Ara 2026 @ 13:00 → 28 Ara 2026 – 3 Oca 2027', () => {
      const r = getOpenReservationRange(localDate(2026, 12, 28, 13, 0))
      expect(r).toEqual({ start: '2026-12-28', end: '2027-01-03' })
    })
  })

  describe('getOpenReservationDate (uyumluluk shim) — start gününü döner', () => {
    it('Pazartesi 1 Haz @ 13:00 → 2026-06-01', () => {
      expect(getOpenReservationDate(localDate(2026, 6, 1, 13, 0))).toBe('2026-06-01')
    })

    it('kapalıyken null', () => {
      expect(getOpenReservationDate(localDate(2026, 6, 1, 9, 0))).toBeNull()
    })
  })

  describe('isReservationDateOpen — aralık dahil sınırlar', () => {
    it('Pazartesi 1 Haz @ 13:00 penceresi içinde tüm günler açık, sınır dışı kapalı', () => {
      const t = localDate(2026, 6, 1, 13, 0)
      expect(isReservationDateOpen('2026-06-01', t)).toBe(true)  // start (Pzt, açılış günü dahil)
      expect(isReservationDateOpen('2026-06-04', t)).toBe(true)  // orta
      expect(isReservationDateOpen('2026-06-07', t)).toBe(true)  // end (Paz)
      expect(isReservationDateOpen('2026-05-31', t)).toBe(false) // önceki hafta
      expect(isReservationDateOpen('2026-06-08', t)).toBe(false) // sonraki hafta
    })

    it('Pazartesi 8 Haz @ 13:00 sonrası: eski hafta kapalı, yeni hafta açık', () => {
      const t = localDate(2026, 6, 8, 13, 0)
      expect(isReservationDateOpen('2026-06-07', t)).toBe(false)
      expect(isReservationDateOpen('2026-06-08', t)).toBe(true)
      expect(isReservationDateOpen('2026-06-14', t)).toBe(true)
    })

    it('Pazartesi 13:00 öncesi hiçbir tarih açık değil', () => {
      const t = localDate(2026, 6, 8, 9, 0)
      expect(isReservationDateOpen('2026-06-08', t)).toBe(false)
      expect(isReservationDateOpen('2026-06-14', t)).toBe(false)
    })
  })

  describe('getNextOpenAt — sonraki Pazartesi 13:00', () => {
    it('hafta ortası Çarşamba → sonraki Pazartesi 13:00', () => {
      const next = getNextOpenAt(localDate(2026, 6, 3, 12, 0))
      expect(next.getFullYear()).toBe(2026)
      expect(next.getMonth()).toBe(5) // Haziran
      expect(next.getDate()).toBe(8)  // Pazartesi
      expect(next.getDay()).toBe(1)
      expect(next.getHours()).toBe(13)
      expect(next.getMinutes()).toBe(0)
    })

    it('Pazartesi 09:00 → bugünün 13:00', () => {
      const next = getNextOpenAt(localDate(2026, 6, 8, 9, 0))
      expect(next.getDate()).toBe(8)
      expect(next.getHours()).toBe(13)
    })

    it('Pazartesi 13:00 (tam) → sonraki Pazartesi 13:00 (15 Haz)', () => {
      const next = getNextOpenAt(localDate(2026, 6, 8, 13, 0))
      expect(next.getDate()).toBe(15)
      expect(next.getDay()).toBe(1)
      expect(next.getHours()).toBe(13)
    })
  })
})
