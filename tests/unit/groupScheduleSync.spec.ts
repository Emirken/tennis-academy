import { describe, it, expect, vi } from 'vitest'

// Firebase modüllerini mock'la — bu test yalnızca SAF yardımcıyı
// (clearGroupSlotsInSchedule) hedefler; gerçek Firestore'a dokunmaz.
vi.mock('@/services/firebase', () => ({ db: {} }))

import { clearGroupSlotsInSchedule } from '../../src/services/groupScheduleSync'

describe('clearGroupSlotsInSchedule (bayat snapshot temizliği)', () => {
  it('gerçek hata: grup K1 -> K2 taşınınca eski K1 girdisi temizlenir', () => {
    // Grup eskiden K1@10:00'daydı; snapshot hâlâ onu tutuyor.
    const schedule: Record<string, any> = {
      K1: {
        '10:00': {
          status: 'occupied',
          reservationType: 'group-lesson',
          groupAssignment: 'GRUP_X',
          groupName: 'Sabah Grubu',
        },
      },
      K2: { '10:00': 'available' },
    }

    clearGroupSlotsInSchedule(schedule, 'GRUP_X')

    // Eski K1 girdisi available olur — /courts artık yanlış "dolu" göstermez.
    expect(schedule.K1['10:00']).toBe('available')
  })

  it('başka gruba ait girdilere DOKUNMAZ', () => {
    const schedule: Record<string, any> = {
      K1: {
        '10:00': { status: 'occupied', groupAssignment: 'GRUP_X', groupName: 'X' },
        '11:00': { status: 'occupied', groupAssignment: 'GRUP_Y', groupName: 'Y' },
      },
    }

    clearGroupSlotsInSchedule(schedule, 'GRUP_X')

    expect(schedule.K1['10:00']).toBe('available')
    // Başka grubun girdisi korunur.
    expect(schedule.K1['11:00']).toMatchObject({ groupAssignment: 'GRUP_Y' })
  })

  it('maintenance/closed/available (string) durumlarına DOKUNMAZ', () => {
    const schedule: Record<string, any> = {
      K1: { '09:00': 'maintenance', '10:00': 'closed', '11:00': 'available' },
    }

    clearGroupSlotsInSchedule(schedule, 'GRUP_X')

    expect(schedule.K1['09:00']).toBe('maintenance')
    expect(schedule.K1['10:00']).toBe('closed')
    expect(schedule.K1['11:00']).toBe('available')
  })

  it('aynı grubun BİRDEN FAZLA kort/saatteki girdisini temizler', () => {
    const schedule: Record<string, any> = {
      K1: { '09:00': { status: 'occupied', groupAssignment: 'GRUP_X' } },
      K3: { '18:00': { status: 'occupied', groupAssignment: 'GRUP_X' } },
    }

    clearGroupSlotsInSchedule(schedule, 'GRUP_X')

    expect(schedule.K1['09:00']).toBe('available')
    expect(schedule.K3['18:00']).toBe('available')
  })

  it('boş/eksik girdi güvenli (no-op)', () => {
    expect(clearGroupSlotsInSchedule({}, 'GRUP_X')).toEqual({})
    expect(clearGroupSlotsInSchedule(undefined as any, 'GRUP_X')).toEqual({})
    const s = { K1: { '10:00': { status: 'occupied', groupAssignment: 'GRUP_X' } } }
    // groupId boşsa dokunmaz.
    clearGroupSlotsInSchedule(s, '')
    expect(s.K1['10:00']).toMatchObject({ groupAssignment: 'GRUP_X' })
  })
})
