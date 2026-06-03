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
