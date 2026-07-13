// Periyodik kort kapatma kuralları — saf çözümleme mantığı testleri.
// (utils/recurringCourtBlocks.ts)
import { describe, it, expect } from 'vitest'
import {
  ruleAppliesToDate,
  ruleCoversCourt,
  dateBlockStatusForCourt,
  resolveRecurringBlocksForDate,
  DAY_INDEX_LABEL_TR,
  type RecurringCourtBlock,
} from '@/utils/recurringCourtBlocks'

const sundayClosedAll: RecurringCourtBlock = {
  id: 'r1',
  dayOfWeek: 0, // Pazar
  status: 'closed',
  startDate: '2026-07-13',
  endDate: '2026-09-13',
  courtIds: [], // tüm kortlar
}

const mondayMaintenanceK2: RecurringCourtBlock = {
  id: 'r2',
  dayOfWeek: 1, // Pazartesi
  status: 'maintenance',
  startDate: '2026-07-13',
  endDate: '2026-08-01',
  courtIds: ['court-2'],
}

const ALL_COURTS = ['court-1', 'court-2', 'court-3']
const TIME_SLOTS = ['09:00', '10:00', '11:00']
const mapCourtId = (id: string) =>
  (({ 'court-1': 'K1', 'court-2': 'K2', 'court-3': 'K3' }) as Record<string, string>)[id] || id

describe('ruleAppliesToDate', () => {
  it('aralık içindeki eşleşen hafta gününde true', () => {
    // 2026-07-19 Pazar
    expect(ruleAppliesToDate(sundayClosedAll, '2026-07-19')).toBe(true)
  })

  it('hafta günü eşleşmiyorsa false', () => {
    // 2026-07-20 Pazartesi
    expect(ruleAppliesToDate(sundayClosedAll, '2026-07-20')).toBe(false)
  })

  it('endDate SONRASI eşleşen günde false; endDate günü dahil', () => {
    // 2026-09-13 Pazar (endDate, dahil) — 2026-09-20 sonraki Pazar
    expect(ruleAppliesToDate(sundayClosedAll, '2026-09-13')).toBe(true)
    expect(ruleAppliesToDate(sundayClosedAll, '2026-09-20')).toBe(false)
  })

  it('startDate ÖNCESİ eşleşen günde false', () => {
    // 2026-07-12 Pazar ama start 13'ü
    expect(ruleAppliesToDate(sundayClosedAll, '2026-07-12')).toBe(false)
  })

  it('bozuk kural/tarihte false (crash yok)', () => {
    expect(ruleAppliesToDate({} as RecurringCourtBlock, '2026-07-19')).toBe(false)
    expect(ruleAppliesToDate(sundayClosedAll, '')).toBe(false)
  })
})

describe('ruleCoversCourt', () => {
  it('boş courtIds tüm kortları kapsar', () => {
    expect(ruleCoversCourt(sundayClosedAll, 'court-3')).toBe(true)
  })

  it('dolu courtIds yalnız listedekileri kapsar', () => {
    expect(ruleCoversCourt(mondayMaintenanceK2, 'court-2')).toBe(true)
    expect(ruleCoversCourt(mondayMaintenanceK2, 'court-1')).toBe(false)
  })
})

describe('dateBlockStatusForCourt', () => {
  const rules = [sundayClosedAll, mondayMaintenanceK2]

  it('bloklu gün + kortta kuralın status\'unu döner', () => {
    expect(dateBlockStatusForCourt(rules, '2026-07-19', 'court-1')).toBe('closed')
    expect(dateBlockStatusForCourt(rules, '2026-07-20', 'court-2')).toBe('maintenance')
  })

  it('kapsam dışı kort/günde null', () => {
    expect(dateBlockStatusForCourt(rules, '2026-07-20', 'court-1')).toBeNull()
    expect(dateBlockStatusForCourt(rules, '2026-07-21', 'court-2')).toBeNull()
  })
})

describe('resolveRecurringBlocksForDate', () => {
  it('eşleşen günde tüm kort × slot kombinasyonlarını mapCourtId ile üretir', () => {
    const resolved = resolveRecurringBlocksForDate({
      rules: [sundayClosedAll],
      date: '2026-07-19', // Pazar
      allCourtIds: ALL_COURTS,
      timeSlots: TIME_SLOTS,
      mapCourtId,
    })
    expect(Object.keys(resolved).sort()).toEqual(['K1', 'K2', 'K3'])
    expect(resolved.K1['09:00']).toBe('closed')
    expect(resolved.K3['11:00']).toBe('closed')
  })

  it('eşleşmeyen günde boş harita', () => {
    const resolved = resolveRecurringBlocksForDate({
      rules: [sundayClosedAll],
      date: '2026-07-21', // Salı
      allCourtIds: ALL_COURTS,
      timeSlots: TIME_SLOTS,
      mapCourtId,
    })
    expect(resolved).toEqual({})
  })

  it('kort-spesifik kural yalnız o kortu doldurur', () => {
    const resolved = resolveRecurringBlocksForDate({
      rules: [mondayMaintenanceK2],
      date: '2026-07-20', // Pazartesi
      allCourtIds: ALL_COURTS,
      timeSlots: TIME_SLOTS,
      mapCourtId,
    })
    expect(Object.keys(resolved)).toEqual(['K2'])
    expect(resolved.K2['10:00']).toBe('maintenance')
  })

  it('çakışan kurallarda ilk eşleşen kazanır', () => {
    const sundayMaintenanceK1: RecurringCourtBlock = {
      dayOfWeek: 0,
      status: 'maintenance',
      startDate: '2026-07-13',
      endDate: '2026-09-13',
      courtIds: ['court-1'],
    }
    const resolved = resolveRecurringBlocksForDate({
      rules: [sundayClosedAll, sundayMaintenanceK1],
      date: '2026-07-19',
      allCourtIds: ALL_COURTS,
      timeSlots: TIME_SLOTS,
      mapCourtId,
    })
    expect(resolved.K1['09:00']).toBe('closed')
  })

  it('gün etiketleri getDay sırasıyla uyumlu (0=Pazar)', () => {
    expect(DAY_INDEX_LABEL_TR[0]).toBe('Pazar')
    expect(DAY_INDEX_LABEL_TR[6]).toBe('Cumartesi')
  })
})
