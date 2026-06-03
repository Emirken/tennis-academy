import { describe, it, expect } from 'vitest'
import { buildCourtSchedule } from '../../src/utils/courtScheduleBuild'
import type { RawReservationDoc } from '../../src/utils/dailyReservationLimit'

// Reservations.vue rezervasyon formundaki doluluk hesabı artık /courts ile
// AYNI motoru (buildCourtSchedule) kullanıyor. Bu test, formun kullandığı
// kurulum (court-1/2/3 anahtarları + occupied nesnesini basit string'e
// düzleştirme) için "takvimde dolu ama rezervasyonda boş" hatasının bir daha
// çıkmadığını sabitler.

const FORM_COURT_IDS = ['court-1', 'court-2', 'court-3']
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
]

// Reservations.vue'daki firestoreToFormCourtId ile aynı eşleme.
const firestoreToFormCourtId = (id: string): string => {
  const m: Record<string, string> = { K1: 'court-1', K2: 'court-2', K3: 'court-3' }
  return m[id] || id
}

const emptyStored = () => {
  const s: Record<string, Record<string, string>> = {}
  for (const c of FORM_COURT_IDS) {
    s[c] = {}
    for (const t of TIME_SLOTS) s[c][t] = 'available'
  }
  return s
}

// Reservations.vue loadCourtSchedule'ın düzleştirme adımının birebir kopyası:
// buildCourtSchedule sonucunu formun beklediği basit string durumlara çevirir.
const getStatus = (slot: any): string => {
  if (!slot) return 'available'
  if (typeof slot === 'string') return slot
  return slot.status || 'available'
}

const buildFormSchedule = (
  reservations: RawReservationDoc[],
  existingGroupIds: Set<string>,
  storedSchedule = emptyStored(),
): Record<string, Record<string, string>> => {
  const built = buildCourtSchedule({
    courtIds: FORM_COURT_IDS,
    timeSlots: TIME_SLOTS,
    storedSchedule,
    reservations,
    existingGroupIds,
    mapCourtId: firestoreToFormCourtId,
  })

  const flat: Record<string, Record<string, string>> = {}
  for (const courtId of FORM_COURT_IDS) {
    flat[courtId] = {}
    for (const time of TIME_SLOTS) {
      const slot = (built[courtId] || {})[time]
      const status = getStatus(slot)
      if (status === 'occupied') {
        const isGroup =
          typeof slot === 'object' &&
          (slot.reservationType === 'group-lesson' || !!slot.groupAssignment)
        flat[courtId][time] = isGroup ? 'group_lesson' : 'occupied'
      } else {
        flat[courtId][time] = status
      }
    }
  }
  return flat
}

describe('Reservation formu doluluğu — /courts ile tutarlı', () => {
  it('gerçek hata: K1 19:00 3 Haziran grup dersi formda BOŞ DEĞİL', () => {
    // Grup dersi K1'de (Firestore'da 'K1'), 19:00-20:00, confirmed.
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'K1',
        startTime: '19:00',
        endTime: '20:00',
        status: 'confirmed',
        reservationType: 'group-lesson',
        groupId: 'GRP_AKSAM',
        groupSchedule: true,
        membershipType: 'adult_group',
        studentName: 'Üye Bir',
      },
    ]

    const schedule = buildFormSchedule(reservations, new Set(['GRP_AKSAM']))

    // Form 'available' OLMAYAN her şeyi rezerve edilemez sayar.
    expect(schedule['court-1']['19:00']).toBe('group_lesson')
    expect(schedule['court-1']['19:00']).not.toBe('available')
  })

  it('pending kort kiralaması (court-1 formatı) formda DOLU', () => {
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'court-1',
        startTime: '19:00',
        endTime: '20:00',
        status: 'pending',
        reservationType: 'court-rental',
        studentName: 'Bekleyen',
      },
    ]

    const schedule = buildFormSchedule(reservations, new Set())
    expect(schedule['court-1']['19:00']).toBe('occupied')
  })

  it('status alanı olmayan (legacy) rezervasyon formda DOLU', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'K2', startTime: '19:00', endTime: '20:00', studentName: 'Eski' },
    ]

    const schedule = buildFormSchedule(reservations, new Set())
    expect(schedule['court-2']['19:00']).toBe('occupied')
  })

  it('endTime olmayan rezervasyon en az başlangıç slotunu DOLDURUR (crash etmez)', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'K3', startTime: '19:00', status: 'confirmed', studentName: 'Bitişsiz' },
    ]

    const schedule = buildFormSchedule(reservations, new Set())
    expect(schedule['court-3']['19:00']).toBe('occupied')
  })

  it('iptal edilen rezervasyon formu DOLDURMAZ', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'K1', startTime: '19:00', endTime: '20:00', status: 'cancelled', studentName: 'İptal' },
    ]

    const schedule = buildFormSchedule(reservations, new Set())
    expect(schedule['court-1']['19:00']).toBe('available')
  })

  it('yetim grup dersi (grubu silinmiş) formu DOLDURMAZ', () => {
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'K1',
        startTime: '19:00',
        endTime: '20:00',
        status: 'confirmed',
        reservationType: 'group-lesson',
        groupId: 'SILINMIS',
        studentName: 'Hayalet',
      },
    ]

    const schedule = buildFormSchedule(reservations, new Set(['BASKA_GRUP']))
    expect(schedule['court-1']['19:00']).toBe('available')
  })

  it('çok saatlik rezervasyon tüm kapsadığı slotları DOLDURUR', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'K2', startTime: '18:00', endTime: '21:00', status: 'confirmed', studentName: 'Uzun' },
    ]

    const schedule = buildFormSchedule(reservations, new Set())
    expect(schedule['court-2']['18:00']).toBe('occupied')
    expect(schedule['court-2']['19:00']).toBe('occupied')
    expect(schedule['court-2']['20:00']).toBe('occupied')
    expect(schedule['court-2']['21:00']).toBe('available') // endTime hariç
  })

  it('admin maintenance/closed formda korunur', () => {
    const stored = emptyStored()
    stored['court-1']['19:00'] = 'maintenance'
    stored['court-2']['19:00'] = 'closed'

    const schedule = buildFormSchedule([], new Set(), stored)
    expect(schedule['court-1']['19:00']).toBe('maintenance')
    expect(schedule['court-2']['19:00']).toBe('closed')
  })
})
