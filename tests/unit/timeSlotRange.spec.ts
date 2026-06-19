import { describe, it, expect, vi, beforeEach } from 'vitest'

// Ders saatleri artık YAPILANDIRILABİLİR (settings/schedule). Bu test:
//  1) getTimeSlots() yeni varsayılanını (07:00 - 23:00 exclusive, 16 slot) sabitler.
//  2) useScheduleSettings composable'ının default + normalize + türev mantığını
//     (timeSlots / hours / hourCount) Firestore'u mock'layarak doğrular.

import { DateHelpers } from '@/services/helpers'

describe('getTimeSlots — yeni varsayılan 07:00 başlangıç', () => {
  it('varsayılan parametrelerle 07:00\'dan 22:00\'a kadar 16 slot döner', () => {
    const slots = DateHelpers.getTimeSlots()
    expect(slots[0]).toBe('07:00')
    expect(slots[slots.length - 1]).toBe('22:00')
    expect(slots).toHaveLength(16)
  })

  it('07:00 artık geçerli bir slot (yeni ilk ders)', () => {
    const slots = DateHelpers.getTimeSlots()
    expect(slots).toContain('07:00')
    expect(slots).toContain('22:00')
  })

  it('06:00 ve 23:00 listede yer almaz (06 aralık dışı, 23 exclusive)', () => {
    const slots = DateHelpers.getTimeSlots()
    expect(slots).not.toContain('06:00')
    expect(slots).not.toContain('23:00')
  })

  it('explicit parametreler defaults\'tan bağımsız çalışır', () => {
    const slots = DateHelpers.getTimeSlots(8, 22, 60)
    expect(slots[0]).toBe('08:00')
    expect(slots[slots.length - 1]).toBe('21:00')
    expect(slots).toHaveLength(14)
  })
})

// useScheduleSettings — Firestore aboneliğini mock'la. subscribeToDocument'a
// verilen callback'i yakalayıp test içinde doc değerini elle besleyebiliriz.
let capturedCallback: ((data: unknown) => void) | null = null

vi.mock('@/services/firestore', () => ({
  FirestoreService: {
    subscribeToDocument: (_c: string, _d: string, cb: (data: unknown) => void) => {
      capturedCallback = cb
      return () => {}
    },
    setDocument: vi.fn(async () => {}),
  },
}))

import { useScheduleSettings, DEFAULT_FIRST_HOUR, DEFAULT_LAST_HOUR } from '@/composables/useScheduleSettings'
import { FirestoreService } from '@/services/firestore'

describe('useScheduleSettings — config tek kaynağı', () => {
  beforeEach(() => {
    capturedCallback = null
    // Singleton state'i sıfırla.
    const s = useScheduleSettings()
    s._unsubscribe()
  })

  it('doc yokken varsayılan 07:00 - 23:00 (16 slot) verir', () => {
    const { firstHour, lastHour, timeSlots, hourCount, hours } = useScheduleSettings()
    expect(firstHour.value).toBe(DEFAULT_FIRST_HOUR)
    expect(lastHour.value).toBe(DEFAULT_LAST_HOUR)
    expect(firstHour.value).toBe(7)
    expect(lastHour.value).toBe(23)
    expect(timeSlots.value[0]).toBe('07:00')
    expect(timeSlots.value[timeSlots.value.length - 1]).toBe('22:00')
    expect(timeSlots.value).toHaveLength(16)
    expect(hourCount.value).toBe(16)
    expect(hours.value[0]).toBe(7)
    expect(hours.value[hours.value.length - 1]).toBe(22)
    expect(hours.value).toHaveLength(16)
  })

  it('Firestore doc gelince değerler ve türevler güncellenir', () => {
    const { firstHour, lastHour, timeSlots, hourCount } = useScheduleSettings()
    capturedCallback?.({ firstHour: 9, lastHour: 21 })
    expect(firstHour.value).toBe(9)
    expect(lastHour.value).toBe(21)
    expect(timeSlots.value[0]).toBe('09:00')
    expect(timeSlots.value[timeSlots.value.length - 1]).toBe('20:00')
    expect(timeSlots.value).toHaveLength(12)
    expect(hourCount.value).toBe(12)
  })

  it('geçersiz aralık (firstHour >= lastHour) varsayılana döner', () => {
    const { firstHour, lastHour } = useScheduleSettings()
    capturedCallback?.({ firstHour: 20, lastHour: 8 })
    expect(firstHour.value).toBe(7)
    expect(lastHour.value).toBe(23)
  })

  it('aralık dışı saatler (0..24) varsayılana düşürülür', () => {
    const { firstHour, lastHour } = useScheduleSettings()
    capturedCallback?.({ firstHour: -3, lastHour: 99 })
    expect(firstHour.value).toBe(7)
    expect(lastHour.value).toBe(23)
  })

  it('updateSchedule normalize edip setDocument(merge) çağırır', async () => {
    const { updateSchedule } = useScheduleSettings()
    await updateSchedule(8, 22)
    expect(FirestoreService.setDocument).toHaveBeenCalledWith(
      'settings',
      'schedule',
      { firstHour: 8, lastHour: 22 },
      true,
    )
  })
})
