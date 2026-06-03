import { describe, it, expect } from 'vitest'
import {
  buildCourtSchedule,
  type CourtScheduleMap,
} from '../../src/utils/courtScheduleBuild'
import type { RawReservationDoc } from '../../src/utils/dailyReservationLimit'
import { buildBusyFreeGrid } from '../../src/utils/studentBusyFree'

// adminParity modu: öğrenci takvimi doluluğunu AdminCalendar ile BİREBİR kurar.
// AdminCalendar yalnızca canlı `reservations`'tan okur, courtSchedule snapshot'ını
// HİÇ okumaz ve iptal olmayan her rezervasyonu (completed/no_show dahil) dolu sayar.

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

const gridParity = (
  reservations: RawReservationDoc[],
  existingGroupIds: Set<string>,
  storedSchedule: CourtScheduleMap = emptyStored(),
) => {
  const schedule = buildCourtSchedule({
    courtIds: COURT_IDS,
    timeSlots: TIME_SLOTS,
    storedSchedule,
    reservations,
    existingGroupIds,
    mapCourtId,
    adminParity: true,
  })
  return buildBusyFreeGrid(schedule, COURT_IDS, TIME_SLOTS)
}

describe('adminParity — completed/no_show admin gibi DOLU', () => {
  it('completed ve no_show rezervasyon dolu sayılır (AdminCalendar yalnızca cancelled gizler)', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'court-1', startTime: '18:00', endTime: '19:00', status: 'completed' },
      { courtId: 'court-2', startTime: '18:00', endTime: '19:00', status: 'no_show' },
    ]
    const grid = gridParity(reservations, new Set())
    expect(grid.K1['18:00']).toBe('busy')
    expect(grid.K2['18:00']).toBe('busy')
  })

  it('cancelled rezervasyon yine boş bırakır', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'court-1', startTime: '12:00', endTime: '13:00', status: 'cancelled' },
    ]
    const grid = gridParity(reservations, new Set())
    expect(grid.K1['12:00']).toBe('free')
  })

  it('pending/confirmed/status-suz da dolu (admin ile aynı)', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'court-1', startTime: '08:00', endTime: '09:00', status: 'pending' },
      { courtId: 'court-2', startTime: '08:00', endTime: '09:00', status: 'confirmed' },
      { courtId: 'court-3', startTime: '08:00', endTime: '09:00' }, // status yok
    ]
    const grid = gridParity(reservations, new Set())
    expect(grid.K1['08:00']).toBe('busy')
    expect(grid.K2['08:00']).toBe('busy')
    expect(grid.K3['08:00']).toBe('busy')
  })
})

describe('adminParity — snapshot HİÇ okunmaz', () => {
  it('snapshot maintenance/closed öğrenciye dolu GÖSTERİLMEZ (admin snapshot okumaz)', () => {
    const stored = emptyStored()
    stored.K3['08:00'] = 'maintenance'
    stored.K3['09:00'] = 'closed'
    const grid = gridParity([], new Set(), stored)
    expect(grid.K3['08:00']).toBe('free')
    expect(grid.K3['09:00']).toBe('free')
  })

  it('snapshot grup yedeği uygulanmaz (canlı rezervasyon yoksa boş kalır)', () => {
    const stored = emptyStored()
    stored.K3['19:00'] = {
      status: 'occupied',
      reservationType: 'group-lesson',
      groupAssignment: 'VAR_GRUP',
      groupName: 'Akşam Grubu',
    }
    const grid = gridParity([], new Set(['VAR_GRUP']), stored)
    expect(grid.K3['19:00']).toBe('free')
  })
})

describe('adminParity — canlı rezervasyon ve orphan', () => {
  it('çok saatli rezervasyon kapsanan tüm slotları dolu yapar (bitiş hariç)', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'court-1', startTime: '14:00', endTime: '17:00', status: 'confirmed' },
    ]
    const grid = gridParity(reservations, new Set())
    expect(grid.K1['14:00']).toBe('busy')
    expect(grid.K1['15:00']).toBe('busy')
    expect(grid.K1['16:00']).toBe('busy')
    expect(grid.K1['17:00']).toBe('free')
  })

  it('silinmiş gruba ait (orphan) rezervasyon boş bırakır (admin de gizler)', () => {
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
    const grid = gridParity(reservations, new Set())
    expect(grid.K1['12:00']).toBe('free')
  })
})

describe('adminParity=false (varsayılan) davranışı DEĞİŞMEZ', () => {
  it('varsayılanda completed boş, snapshot maintenance dolu kalır', () => {
    const stored = emptyStored()
    stored.K3['08:00'] = 'maintenance'
    const schedule = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: stored,
      reservations: [
        { courtId: 'court-1', startTime: '18:00', endTime: '19:00', status: 'completed' },
      ],
      existingGroupIds: new Set(),
      mapCourtId,
      // adminParity yok → eski davranış
    })
    const grid = buildBusyFreeGrid(schedule, COURT_IDS, TIME_SLOTS)
    expect(grid.K1['18:00']).toBe('free')     // completed → boş (eski kural)
    expect(grid.K3['08:00']).toBe('busy')     // maintenance → dolu (snapshot korunur)
  })
})
