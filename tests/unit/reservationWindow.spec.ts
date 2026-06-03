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

describe('reservationWindow (haftalık Pazar 20:00)', () => {
  describe('sabitler', () => {
    it('açılma saati 20:00', () => {
      expect(RESERVATION_OPEN_HOUR).toBe(20)
    })
    it('açılma günü Pazar (getDay === 0)', () => {
      expect(RESERVATION_OPEN_WEEKDAY).toBe(0)
    })
  })

  describe('getOpenReservationRange — temel senaryo', () => {
    it('Pazar 31 May 2026 @ 20:00 → Pzt 1 Haz – Paz 7 Haz', () => {
      const r = getOpenReservationRange(localDate(2026, 5, 31, 20, 0))
      expect(r).toEqual({ start: '2026-06-01', end: '2026-06-07' })
    })

    it('Pazar 31 May 2026 @ 19:59 → hâlâ önceki hafta (25 May – 31 May)', () => {
      const r = getOpenReservationRange(localDate(2026, 5, 31, 19, 59))
      expect(r).toEqual({ start: '2026-05-25', end: '2026-05-31' })
    })

    it('Çarşamba 3 Haz 2026 (hafta ortası) → o haftanın penceresi 1–7 Haz', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 3, 12, 0))
      expect(r).toEqual({ start: '2026-06-01', end: '2026-06-07' })
    })

    it('Pazar 7 Haz 2026 @ 19:59 → hâlâ açık (1–7 Haz, son gün son slota kadar)', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 7, 19, 59))
      expect(r).toEqual({ start: '2026-06-01', end: '2026-06-07' })
    })

    it('Pazar 7 Haz 2026 @ 20:00 → yeni haftaya kayar (8–14 Haz)', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 7, 20, 0))
      expect(r).toEqual({ start: '2026-06-08', end: '2026-06-14' })
    })

    it('Pazartesi 1 Haz 2026 00:00 → 1–7 Haz açık', () => {
      const r = getOpenReservationRange(localDate(2026, 6, 1, 0, 0))
      expect(r).toEqual({ start: '2026-06-01', end: '2026-06-07' })
    })
  })

  describe('ay/yıl sınırı', () => {
    it('ay geçişi: Pazar 31 May @ 20:00 → Haziran ayına açılır', () => {
      const r = getOpenReservationRange(localDate(2026, 5, 31, 20, 0))
      expect(r?.start).toBe('2026-06-01')
    })

    it('yıl geçişi: Pazar 27 Ara 2026 @ 20:00 → 28 Ara 2026 – 3 Oca 2027', () => {
      const r = getOpenReservationRange(localDate(2026, 12, 27, 20, 0))
      expect(r).toEqual({ start: '2026-12-28', end: '2027-01-03' })
    })
  })

  describe('getOpenReservationDate (uyumluluk shim) — start gününü döner', () => {
    it('Pazar 31 May @ 20:00 → 2026-06-01', () => {
      expect(getOpenReservationDate(localDate(2026, 5, 31, 20, 0))).toBe('2026-06-01')
    })
  })

  describe('isReservationDateOpen — aralık dahil sınırlar', () => {
    it('Pazar 31 May @ 20:00 penceresi içinde tüm günler açık, sınır dışı kapalı', () => {
      const t = localDate(2026, 5, 31, 20, 0)
      expect(isReservationDateOpen('2026-06-01', t)).toBe(true)  // start (Pzt)
      expect(isReservationDateOpen('2026-06-04', t)).toBe(true)  // orta
      expect(isReservationDateOpen('2026-06-07', t)).toBe(true)  // end (Paz)
      expect(isReservationDateOpen('2026-05-31', t)).toBe(false) // açılış Pazarı dahil değil
      expect(isReservationDateOpen('2026-06-08', t)).toBe(false) // sonraki hafta
    })

    it('Pazar 7 Haz @ 20:00 sonrası: eski hafta kapalı, yeni hafta açık', () => {
      const t = localDate(2026, 6, 7, 20, 0)
      expect(isReservationDateOpen('2026-06-07', t)).toBe(false)
      expect(isReservationDateOpen('2026-06-08', t)).toBe(true)
      expect(isReservationDateOpen('2026-06-14', t)).toBe(true)
    })
  })

  describe('getNextOpenAt — sonraki Pazar 20:00', () => {
    it('hafta ortası Çarşamba → bu haftanın Pazar 20:00', () => {
      const next = getNextOpenAt(localDate(2026, 6, 3, 12, 0))
      expect(next.getFullYear()).toBe(2026)
      expect(next.getMonth()).toBe(5) // Haziran
      expect(next.getDate()).toBe(7)  // Pazar
      expect(next.getDay()).toBe(0)
      expect(next.getHours()).toBe(20)
      expect(next.getMinutes()).toBe(0)
    })

    it('Pazar 19:00 → bugünün 20:00', () => {
      const next = getNextOpenAt(localDate(2026, 6, 7, 19, 0))
      expect(next.getDate()).toBe(7)
      expect(next.getHours()).toBe(20)
    })

    it('Pazar 20:00 (tam) → sonraki Pazar 20:00 (14 Haz)', () => {
      const next = getNextOpenAt(localDate(2026, 6, 7, 20, 0))
      expect(next.getDate()).toBe(14)
      expect(next.getDay()).toBe(0)
      expect(next.getHours()).toBe(20)
    })
  })
})
