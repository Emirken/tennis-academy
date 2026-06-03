import { describe, it, expect } from 'vitest'
import {
  buildCourtSchedule,
  type CourtScheduleMap,
} from '../../src/utils/courtScheduleBuild'
import type { RawReservationDoc } from '../../src/utils/dailyReservationLimit'
import {
  buildBusyFreeGrid,
  isCellBusy,
  countBusyCells,
} from '../../src/utils/studentBusyFree'

// Öğrenci takvimi dolu/boş ızgarası. buildCourtSchedule (tek motor) çıktısını
// detaysız 'busy' | 'free' değerlerine indirger; öğrenci isim/grup görmemeli.

const COURT_IDS = ['K1', 'K2', 'K3']
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
]

const mapCourtId = (id: string): string => {
  const m: Record<string, string> = { 'court-1': 'K1', 'court-2': 'K2', 'court-3': 'K3' }
  return m[id] || id
}

const emptyStored = (): CourtScheduleMap => {
  const s: CourtScheduleMap = {}
  for (const c of COURT_IDS) {
    s[c] = {}
    for (const t of TIME_SLOTS) s[c][t] = 'available'
  }
  return s
}

const buildGridFrom = (
  reservations: RawReservationDoc[],
  existingGroupIds: Set<string>,
  storedSchedule: CourtScheduleMap = emptyStored(),
  groupNames: Record<string, string> = {},
) => {
  const schedule = buildCourtSchedule({
    courtIds: COURT_IDS,
    timeSlots: TIME_SLOTS,
    storedSchedule,
    reservations,
    existingGroupIds,
    mapCourtId,
    groupNames,
  })
  return buildBusyFreeGrid(schedule, COURT_IDS, TIME_SLOTS)
}

describe('isCellBusy — durum string/nesne indirgemesi', () => {
  it('available ve undefined → boş', () => {
    expect(isCellBusy('available')).toBe(false)
    expect(isCellBusy(undefined)).toBe(false)
  })

  it('occupied / maintenance / closed → dolu', () => {
    expect(isCellBusy({ status: 'occupied' })).toBe(true)
    expect(isCellBusy('maintenance')).toBe(true)
    expect(isCellBusy('closed')).toBe(true)
  })
})

describe('buildBusyFreeGrid — canlı rezervasyon doluluğu', () => {
  it('onaylı kort kiralaması slotu dolu yapar; diğer slotlar boş', () => {
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'court-1',
        startTime: '20:00',
        endTime: '21:00',
        status: 'confirmed',
        reservationType: 'court-rental',
        studentName: 'Ayda İleri',
        studentId: 'u-ayda',
      },
    ]
    const grid = buildGridFrom(reservations, new Set())
    expect(grid.K1['20:00']).toBe('busy')
    expect(grid.K1['19:00']).toBe('free')
    expect(grid.K2['20:00']).toBe('free')
  })

  it('pending ve status\'suz rezervasyon da dolu sayılır (takvimle tutarlı)', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'court-2', startTime: '09:00', endTime: '10:00', status: 'pending' },
      { courtId: 'court-3', startTime: '11:00', endTime: '12:00' }, // status yok
    ]
    const grid = buildGridFrom(reservations, new Set())
    expect(grid.K2['09:00']).toBe('busy')
    expect(grid.K3['11:00']).toBe('busy')
  })

  it('cancelled ve completed rezervasyon slotu boş bırakır', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'court-1', startTime: '08:00', endTime: '09:00', status: 'cancelled' },
      { courtId: 'court-1', startTime: '10:00', endTime: '11:00', status: 'completed' },
    ]
    const grid = buildGridFrom(reservations, new Set())
    expect(grid.K1['08:00']).toBe('free')
    expect(grid.K1['10:00']).toBe('free')
  })

  it('çok saatli rezervasyon kapsanan tüm slotları dolu yapar (bitiş hariç)', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'court-1', startTime: '14:00', endTime: '17:00', status: 'confirmed' },
    ]
    const grid = buildGridFrom(reservations, new Set())
    expect(grid.K1['14:00']).toBe('busy')
    expect(grid.K1['15:00']).toBe('busy')
    expect(grid.K1['16:00']).toBe('busy')
    expect(grid.K1['17:00']).toBe('free') // bitiş slotu dahil değil
  })
})

describe('buildBusyFreeGrid — gizlilik (detay sızdırmaz)', () => {
  it('grup dersi dolu yapar ama çıkan değer çıplak string olur (isim/grup taşımaz)', () => {
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'K2',
        startTime: '18:00',
        endTime: '19:00',
        status: 'confirmed',
        reservationType: 'group-lesson',
        groupId: 'GRUP_A',
        membershipType: 'adult_group',
        studentName: 'Üye Bir',
      },
    ]
    const grid = buildGridFrom(reservations, new Set(['GRUP_A']), emptyStored(), {
      GRUP_A: 'Sabah Grubu',
    })
    const cell = grid.K2['18:00']
    expect(cell).toBe('busy')
    // Çıplak string olmalı; nesne değil → isim/grup/öğrenci alanı taşıyamaz.
    expect(typeof cell).toBe('string')
    expect(JSON.stringify(grid)).not.toContain('Sabah Grubu')
    expect(JSON.stringify(grid)).not.toContain('Üye Bir')
    expect(JSON.stringify(grid)).not.toContain('GRUP_A')
  })
})

describe('buildBusyFreeGrid — orphan grup', () => {
  it('silinmiş gruba ait rezervasyon boş bırakır', () => {
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'court-1',
        startTime: '12:00',
        endTime: '13:00',
        status: 'confirmed',
        reservationType: 'group-lesson',
        groupId: 'SILINMIS_GRUP',
      },
    ]
    // existingGroupIds boş → grup yok → orphan → slot boş
    const grid = buildGridFrom(reservations, new Set())
    expect(grid.K1['12:00']).toBe('free')
  })
})

describe('buildBusyFreeGrid — admin durumları', () => {
  it('maintenance ve closed dolu (rezerve edilemez) sayılır', () => {
    const stored = emptyStored()
    stored.K3['08:00'] = 'maintenance'
    stored.K3['09:00'] = 'closed'
    const grid = buildGridFrom([], new Set(), stored)
    expect(grid.K3['08:00']).toBe('busy')
    expect(grid.K3['09:00']).toBe('busy')
  })
})

describe('countBusyCells — ay görünümü özeti', () => {
  it('bir günün dolu slot sayısını verir', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'court-1', startTime: '08:00', endTime: '10:00', status: 'confirmed' }, // 2 slot
      { courtId: 'court-2', startTime: '15:00', endTime: '16:00', status: 'pending' },   // 1 slot
    ]
    const grid = buildGridFrom(reservations, new Set())
    expect(countBusyCells(grid)).toBe(3)
  })
})
