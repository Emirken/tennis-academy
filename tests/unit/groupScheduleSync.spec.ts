import { describe, it, expect, vi } from 'vitest'

// Firebase modüllerini mock'la — bu test yalnızca SAF yardımcıyı
// (clearGroupSlotsInSchedule) hedefler; gerçek Firestore'a dokunmaz.
vi.mock('@/services/firebase', () => ({ db: {} }))

import {
  clearGroupSlotsInSchedule,
  selectFutureGroupReservationIds,
} from '../../src/services/groupScheduleSync'

// Firestore Timestamp benzeri ({ toDate() }) yardımcı.
const ts = (iso: string) => ({ toDate: () => new Date(iso) })

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

describe('selectFutureGroupReservationIds (silme kapsamı — hayalet ders düzeltmesi)', () => {
  const TODAY = '2026-06-29'

  it('KÖK NEDEN: groupId boş ama groupAssignment dolu kayıt artık SEÇİLİR', () => {
    // Eski/migrate kayıt: takvimde grup dersi olarak görünür (getReservationGroupId
    // groupAssignment'a düşer) ama eski silme where('groupId','==') ile bulamazdı.
    const docs = [
      { id: 'ghost', data: { groupId: '', groupAssignment: 'G1', date: ts('2099-01-01') } },
    ]
    expect(selectFutureGroupReservationIds(docs, 'G1', TODAY)).toEqual(['ghost'])
  })

  it('SEKONDER: string tarihli (Timestamp olmayan) kayıt da yakalanır', () => {
    // where('date','>=',Date) string tarihleri kaçırırdı; bellekte normalize edilir.
    const docs = [
      { id: 'str', data: { groupId: 'G1', date: '2099-01-01' } },
    ]
    expect(selectFutureGroupReservationIds(docs, 'G1', TODAY)).toEqual(['str'])
  })

  it('dedup: groupId VE groupAssignment ikisi de dolu kayıt tek kez döner', () => {
    const docs = [
      { id: 'both', data: { groupId: 'G1', groupAssignment: 'G1', date: ts('2099-01-01') } },
      { id: 'both', data: { groupId: 'G1', groupAssignment: 'G1', date: ts('2099-01-01') } },
    ]
    expect(selectFutureGroupReservationIds(docs, 'G1', TODAY)).toEqual(['both'])
  })

  it('geçmiş tarihli kayıt SEÇİLMEZ (geçmiş korunur)', () => {
    const docs = [
      { id: 'past', data: { groupId: 'G1', date: ts('2000-01-01') } },
      { id: 'today', data: { groupId: 'G1', date: TODAY } }, // bugün dahil
    ]
    expect(selectFutureGroupReservationIds(docs, 'G1', TODAY)).toEqual(['today'])
  })

  it('başka gruba ait kayıt SEÇİLMEZ', () => {
    const docs = [
      { id: 'other', data: { groupId: 'G2', date: ts('2099-01-01') } },
      { id: 'mineByGa', data: { groupAssignment: 'G1', date: ts('2099-01-01') } },
    ]
    expect(selectFutureGroupReservationIds(docs, 'G1', TODAY)).toEqual(['mineByGa'])
  })

  it('tarihi çözülemeyen/eksik kayıt güvenli tarafta SEÇİLMEZ', () => {
    const docs = [
      { id: 'nodate', data: { groupId: 'G1' } },
      { id: 'baddate', data: { groupId: 'G1', date: 'çöp' } },
    ]
    expect(selectFutureGroupReservationIds(docs, 'G1', TODAY)).toEqual([])
  })
})
