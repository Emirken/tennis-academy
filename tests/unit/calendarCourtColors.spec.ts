import { describe, it, expect } from 'vitest'
import { getReservationTypeColor } from '@/utils/reservationTypeColor'

// AdminCalendar.vue içindeki getEventTypeColor mantığının birebir kopyası.
// Renk artık KORT'a göre değil TÜRE göre verilir (grup=turuncu, özel=yeşil,
// rezervasyon=mor). Kort sırası ayrıca K1 (sol) → K2 → K3 (sağ) olarak sabittir.
interface CalendarEventLike {
  type: string
  isGroup: boolean
  groupId?: string
}

const getEventTypeColor = (event: CalendarEventLike): string => {
  return getReservationTypeColor({
    type: event.type,
    reservationType: event.isGroup ? 'group-lesson' : event.type,
    groupId: event.groupId,
    groupAssignment: event.groupId,
  })
}

describe('AdminCalendar getEventTypeColor — tür bazlı takvim rengi', () => {
  it('grup dersi turuncu döner', () => {
    expect(getEventTypeColor({ type: 'group_lesson', isGroup: true, groupId: 'g1' }))
      .toBe('#E65100')
  })

  it('özel ders yeşil döner', () => {
    expect(getEventTypeColor({ type: 'lesson', isGroup: false })).toBe('#388E3C')
    expect(getEventTypeColor({ type: 'private_lesson', isGroup: false })).toBe('#388E3C')
  })

  it('kort kiralama / rezervasyon mor döner', () => {
    expect(getEventTypeColor({ type: 'court_rental', isGroup: false })).toBe('#7B1FA2')
  })
})

describe('Takvim kort sırası — K1 solda, K2 ortada, K3 sağda', () => {
  it('courts dizisi K1 → K2 → K3 sırasındadır', () => {
    // AdminCalendar.vue ve StudentCourtCalendar.vue ile aynı sabit sıra.
    const courts = [
      { id: 'K1', name: 'Kort 1' },
      { id: 'K2', name: 'Kort 2' },
      { id: 'K3', name: 'Kort 3' },
    ]
    expect(courts.map((c) => c.id)).toEqual(['K1', 'K2', 'K3'])
  })
})

// AdminCalendar.vue'deki courtSortIndex + getHourEvents/getDayEvents sıralama
// mantığının birebir kopyası. Aynı saatte yan yana dolu kortların takvimde
// K1 → K2 → K3 sırasıyla görünmesini garanti eder (Firebase'den gelen rastgele
// sıra yerine).
const courts = [
  { id: 'K1', name: 'Kort 1' },
  { id: 'K2', name: 'Kort 2' },
  { id: 'K3', name: 'Kort 3' },
]
const normalizeCourtId = (courtId: string): string => {
  const mapping: Record<string, string> = {
    'court-1': 'K1', 'court-2': 'K2', 'court-3': 'K3',
    'court_1': 'K1', 'court_2': 'K2', 'court_3': 'K3',
  }
  return mapping[courtId] || courtId
}
const courtSortIndex = (courtId: string): number => {
  const i = courts.findIndex((c) => c.id === normalizeCourtId(courtId))
  return i === -1 ? Number.MAX_SAFE_INTEGER : i
}

interface SlotLike { courtId: string; start: Date }

describe('Takvim aynı-saat slot sıralaması (courtSortIndex)', () => {
  it('normalize edilmemiş courtId değerlerini de doğru sıralar', () => {
    expect(courtSortIndex('court-1')).toBe(0)
    expect(courtSortIndex('K2')).toBe(1)
    expect(courtSortIndex('court_3')).toBe(2)
  })

  it('bilinmeyen kort en sona düşer', () => {
    expect(courtSortIndex('K9')).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('getHourEvents: aynı saatte karışık gelen kortlar K1 → K2 → K3 sıralanır', () => {
    const t = new Date('2026-06-03T18:00:00')
    // Firebase'den karışık gelen sıra (K3, K1, K2):
    const events: SlotLike[] = [
      { courtId: 'K3', start: t },
      { courtId: 'K1', start: t },
      { courtId: 'K2', start: t },
    ]
    const sorted = [...events].sort((a, b) =>
      courtSortIndex(a.courtId) - courtSortIndex(b.courtId) ||
      a.start.getTime() - b.start.getTime(),
    )
    expect(sorted.map((e) => e.courtId)).toEqual(['K1', 'K2', 'K3'])
  })

  it('getDayEvents: önce saate, eşit saatte K1 → K2 → K3 sıralanır', () => {
    const early = new Date('2026-06-03T17:00:00')
    const late = new Date('2026-06-03T18:00:00')
    const events: SlotLike[] = [
      { courtId: 'K2', start: late },
      { courtId: 'K3', start: early },
      { courtId: 'K1', start: late },
      { courtId: 'K1', start: early },
    ]
    const sorted = [...events].sort((a, b) =>
      a.start.getTime() - b.start.getTime() ||
      courtSortIndex(a.courtId) - courtSortIndex(b.courtId),
    )
    // 17:00 bloğu önce (K1, K3), sonra 18:00 bloğu (K1, K2)
    expect(sorted.map((e) => `${e.courtId}@${e.start.getHours()}`)).toEqual([
      'K1@17', 'K3@17', 'K1@18', 'K2@18',
    ])
  })
})
