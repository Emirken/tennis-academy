import { describe, it, expect } from 'vitest'
import {
  getAvailableTimeOptions,
  getAvailableCourtOptions,
  getSelectableTimeOptions,
  getSelectableCourtOptions,
  type OccupiedSlot,
} from '@/services/courtAvailability'

// AdminCalendar `availableTimeSlots` davranışı: dolu saat LİSTEDEN ÇIKAR (sadece
// disabled değil). getSelectable* fonksiyonları bunu sağlamalı.

const ALL_TIMES = ['17:00', '18:00', '19:00', '20:00']
const ALL_COURTS = [
  { title: 'Kort 1', value: 'court-1' },
  { title: 'Kort 2', value: 'court-2' },
  { title: 'Kort 3', value: 'court-3' },
]

// Slot: Pazar 18:00 / 19:00 Kort 3 dolu (screenshot senaryosu: court-3 / K3)
const occupied: OccupiedSlot[] = [
  { day: 'sunday', time: '18:00', court: 'K3', groupName: '13-16 Yaş Grup A', isGroup: true },
  { day: 'sunday', time: '19:00', court: 'K3', studentName: 'Burak Kuduğ', isGroup: false },
]

describe('getSelectableTimeOptions — dolu saatleri listeden çıkarır (AdminCalendar mantığı)', () => {
  it('dolu saatler (18:00, 19:00) sonuçta YOK', () => {
    const opts = getSelectableTimeOptions(occupied, 'Pazar', 'court-3', ALL_TIMES)
    const values = opts.map(o => o.value)
    expect(values).toEqual(['17:00', '20:00'])
    expect(values).not.toContain('18:00')
    expect(values).not.toContain('19:00')
  })

  it('hiç dolu yoksa tüm saatler kalır', () => {
    const opts = getSelectableTimeOptions(occupied, 'Pazartesi', 'court-1', ALL_TIMES)
    expect(opts.map(o => o.value)).toEqual(ALL_TIMES)
  })

  it('döndürülen item disabled alanı taşımaz (temiz {title,value})', () => {
    const opts = getSelectableTimeOptions(occupied, 'Pazar', 'court-3', ALL_TIMES)
    opts.forEach(o => {
      expect(o).toHaveProperty('title')
      expect(o).toHaveProperty('value')
      expect((o as any).disabled).toBeUndefined()
    })
  })

  it('K formatlı court girdisini de normalize eder (court-3 == K3)', () => {
    const optsCourt = getSelectableTimeOptions(occupied, 'Pazar', 'court-3', ALL_TIMES)
    const optsK = getSelectableTimeOptions(occupied, 'Pazar', 'K3', ALL_TIMES)
    expect(optsCourt.map(o => o.value)).toEqual(optsK.map(o => o.value))
  })
})

describe('getSelectableCourtOptions — dolu kortları listeden çıkarır', () => {
  it('Pazar 18:00 için Kort 3 dolu → sonuçta YOK', () => {
    const opts = getSelectableCourtOptions(occupied, 'Pazar', '18:00', ALL_COURTS, 'court')
    const values = opts.map(o => o.value)
    expect(values).toEqual(['court-1', 'court-2'])
    expect(values).not.toContain('court-3')
  })

  it('boş saatte tüm kortlar kalır', () => {
    const opts = getSelectableCourtOptions(occupied, 'Pazar', '20:00', ALL_COURTS, 'court')
    expect(opts.map(o => o.value)).toEqual(['court-1', 'court-2', 'court-3'])
  })
})

describe('getAvailable* (eski davranış) korunur — disabled+etiket', () => {
  it('getAvailableTimeOptions dolu saati disabled+DOLU etiketiyle TUTAR', () => {
    const opts = getAvailableTimeOptions(occupied, 'Pazar', 'court-3', ALL_TIMES)
    expect(opts.length).toBe(ALL_TIMES.length) // hiçbiri çıkarılmaz
    const busy = opts.find(o => o.value === '18:00')!
    expect(busy.disabled).toBe(true)
    expect(busy.title).toContain('DOLU')
  })

  it('getAvailableCourtOptions dolu kortu disabled+DOLU etiketiyle TUTAR', () => {
    const opts = getAvailableCourtOptions(occupied, 'Pazar', '18:00', ALL_COURTS, 'court')
    expect(opts.length).toBe(ALL_COURTS.length)
    const busy = opts.find(o => o.value === 'court-3')!
    expect(busy.disabled).toBe(true)
    expect(busy.title).toContain('DOLU')
  })
})
