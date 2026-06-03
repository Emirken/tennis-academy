import { describe, it, expect } from 'vitest'
import { buildCourtSchedule } from '@/utils/courtScheduleBuild'
import { buildCellKindGrid } from '@/utils/studentBusyFree'
import type { RawReservationDoc } from '@/utils/dailyReservationLimit'

const courtIds = ['K1', 'K2', 'K3']
const timeSlots = ['08:00', '09:00', '10:00']
const mapCourtId = (id: string) => {
  const m: Record<string, string> = {
    'court-1': 'K1', 'court-2': 'K2', 'court-3': 'K3',
  }
  return m[id] || id
}

function build(reservations: RawReservationDoc[]) {
  const schedule = buildCourtSchedule({
    courtIds,
    timeSlots,
    storedSchedule: {},
    reservations,
    existingGroupIds: new Set(['g1']),
    mapCourtId,
    adminParity: true,
  })
  return buildCellKindGrid(schedule, courtIds, timeSlots)
}

describe('buildCellKindGrid — öğrenci günlük takvim tür ızgarası', () => {
  it('boş slotlar free döner', () => {
    const grid = build([])
    expect(grid.K1['08:00']).toBe('free')
    expect(grid.K2['10:00']).toBe('free')
  })

  it('grup dersi group-lesson (turuncu) olarak işaretlenir', () => {
    const grid = build([
      {
        id: 'r1', courtId: 'court-1', startTime: '08:00', endTime: '09:00',
        status: 'confirmed', reservationType: 'group-lesson', groupId: 'g1',
      } as RawReservationDoc,
    ])
    expect(grid.K1['08:00']).toBe('group-lesson')
    expect(grid.K1['09:00']).toBe('free')
  })

  it('özel ders private-lesson (yeşil) olarak işaretlenir', () => {
    const grid = build([
      {
        id: 'r2', courtId: 'court-2', startTime: '09:00', endTime: '10:00',
        status: 'confirmed', reservationType: 'private-lesson',
      } as RawReservationDoc,
    ])
    expect(grid.K2['09:00']).toBe('private-lesson')
  })

  it('kort kiralama reservation (mor) olarak işaretlenir', () => {
    const grid = build([
      {
        id: 'r3', courtId: 'court-3', startTime: '10:00', endTime: '11:00',
        status: 'confirmed', reservationType: 'court-rental', type: 'court_rental',
      } as RawReservationDoc,
    ])
    expect(grid.K3['10:00']).toBe('reservation')
  })

  it('çok saatlik rezervasyon kapsadığı tüm slotları doldurur', () => {
    const grid = build([
      {
        id: 'r4', courtId: 'court-1', startTime: '08:00', endTime: '10:00',
        status: 'confirmed', reservationType: 'court-rental',
      } as RawReservationDoc,
    ])
    expect(grid.K1['08:00']).toBe('reservation')
    expect(grid.K1['09:00']).toBe('reservation')
    expect(grid.K1['10:00']).toBe('free')
  })

  it('iptal edilen rezervasyon free kalır', () => {
    const grid = build([
      {
        id: 'r5', courtId: 'court-1', startTime: '08:00', endTime: '09:00',
        status: 'cancelled', reservationType: 'court-rental',
      } as RawReservationDoc,
    ])
    expect(grid.K1['08:00']).toBe('free')
  })
})
