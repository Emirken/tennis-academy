// buildCourtSchedule `adminBlocks` girdisi (periyodik kapatma kuralları):
// - snapshot'tan bağımsız uygulanır, adminParity açıkken bile
// - canlı rezervasyon adminBlocks slotunu EZMEZ
// - snapshot grup yedeği bloklu slota yazılmaz
import { describe, it, expect } from 'vitest'
import { buildCourtSchedule } from '@/utils/courtScheduleBuild'
import type { RawReservationDoc } from '@/utils/dailyReservationLimit'

const COURT_IDS = ['K1', 'K2']
const TIME_SLOTS = ['09:00', '10:00', '11:00']
const mapCourtId = (id: string) =>
  (({ 'court-1': 'K1', 'court-2': 'K2' }) as Record<string, string>)[id] || id

const baseInput = {
  courtIds: COURT_IDS,
  timeSlots: TIME_SLOTS,
  storedSchedule: {},
  reservations: [] as RawReservationDoc[],
  existingGroupIds: new Set<string>(),
  mapCourtId,
}

describe('buildCourtSchedule adminBlocks', () => {
  it('adminBlocks slotları verilen statüyle işaretler', () => {
    const result = buildCourtSchedule({
      ...baseInput,
      adminBlocks: { K1: { '09:00': 'closed', '10:00': 'maintenance' } },
    })
    expect(result.K1['09:00']).toBe('closed')
    expect(result.K1['10:00']).toBe('maintenance')
    expect(result.K1['11:00']).toBe('available')
    expect(result.K2['09:00']).toBe('available')
  })

  it('adminParity açıkken bile uygulanır (öğrenci takvimi bloğu görmeli)', () => {
    const result = buildCourtSchedule({
      ...baseInput,
      adminParity: true,
      adminBlocks: { K1: { '09:00': 'closed' } },
    })
    expect(result.K1['09:00']).toBe('closed')
    expect(result.K1['10:00']).toBe('available')
  })

  it('canlı rezervasyon adminBlocks slotunu ezmez', () => {
    const reservation = {
      courtId: 'court-1',
      startTime: '09:00',
      endTime: '10:00',
      status: 'confirmed',
      studentName: 'Ali Veli',
    } as unknown as RawReservationDoc

    const result = buildCourtSchedule({
      ...baseInput,
      reservations: [reservation],
      adminBlocks: { K1: { '09:00': 'closed' } },
    })
    expect(result.K1['09:00']).toBe('closed')
  })

  it('adminBlocks yoksa davranış değişmez (geriye uyumlu)', () => {
    const reservation = {
      courtId: 'court-1',
      startTime: '09:00',
      endTime: '10:00',
      status: 'confirmed',
      studentName: 'Ali Veli',
    } as unknown as RawReservationDoc

    const result = buildCourtSchedule({ ...baseInput, reservations: [reservation] })
    expect((result.K1['09:00'] as { status: string }).status).toBe('occupied')
    expect(result.K1['10:00']).toBe('available')
  })

  it('snapshot maintenance/closed ile birlikte çalışır; adminBlocks öncelikli', () => {
    const result = buildCourtSchedule({
      ...baseInput,
      storedSchedule: { K1: { '09:00': 'maintenance', '10:00': 'closed' } },
      adminBlocks: { K1: { '09:00': 'closed' } },
    })
    // adminBlocks kural statüsü snapshot'ı ezer
    expect(result.K1['09:00']).toBe('closed')
    // snapshot'taki diğer admin durumu korunur
    expect(result.K1['10:00']).toBe('closed')
  })

  it('snapshot grup yedeği bloklu slota yazılmaz', () => {
    const groupSlot = {
      status: 'occupied',
      reservationType: 'group-lesson',
      groupAssignment: 'g1',
    }
    const result = buildCourtSchedule({
      ...baseInput,
      existingGroupIds: new Set(['g1']),
      storedSchedule: { K1: { '09:00': groupSlot } },
      adminBlocks: { K1: { '09:00': 'maintenance' } },
    })
    expect(result.K1['09:00']).toBe('maintenance')
  })
})
