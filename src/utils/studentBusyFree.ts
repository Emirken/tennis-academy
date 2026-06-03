// Öğrenci takvimi (StudentCourtCalendar) için dolu/boş ızgarası üretir.
//
// Öğrenci yalnızca her (kort, saat) hücresinin DOLU mu BOŞ mu olduğunu görür;
// isim/grup gibi hiçbir detay görmez. Bu yüzden buildCourtSchedule'ın zengin
// SlotValue çıktısını (occupied nesneleri, maintenance/closed string'leri),
// detay alanı TAŞIMAYAN çıplak 'busy' | 'free' değerlerine indirgeriz.
//
// Doluluk kararı tek motordan (buildCourtSchedule + isSlotBlockingReservation)
// geldiği için takvim, /courts ve rezervasyon formu daima aynı sonucu verir
// (bkz. src/utils/courtScheduleBuild.ts, slot-blocking-status notu).

import type { CourtScheduleMap, SlotValue } from './courtScheduleBuild'
import {
  classifyReservationKind,
  type ReservationKind,
  type IsGroupMembership,
} from './reservationTypeColor'
import type { RawReservationDoc } from './dailyReservationLimit'

export type BusyFree = 'busy' | 'free'

// Öğrenci günlük takviminde her hücrenin TÜRÜ: boş ya da üç dolu türünden biri.
// Renk için kullanılır (grup=turuncu, özel=yeşil, rezervasyon=mor).
export type CellKind = 'free' | ReservationKind

// Bir slotun durum string'ini çıkarır (string ya da {status} nesnesi olabilir).
function statusOf(slot: SlotValue | undefined): string {
  if (!slot) return 'available'
  if (typeof slot === 'string') return slot
  if (typeof slot === 'object') return ((slot as { status?: string }).status) || 'available'
  return 'available'
}

// Hücre dolu mu? 'available' dışındaki tüm durumlar (occupied / maintenance /
// closed / bilinmeyen) öğrenci için rezerve edilemez → DOLU sayılır. Böylece
// admin'in koyduğu bakım/kapalı durumları da öğrenciye "boş" gibi görünmez.
export function isCellBusy(slot: SlotValue | undefined): boolean {
  return statusOf(slot) !== 'available'
}

// buildCourtSchedule çıktısını, detay taşımayan çıplak dolu/boş ızgarasına
// indirger: courtId -> timeSlot -> 'busy' | 'free'.
export function buildBusyFreeGrid(
  schedule: CourtScheduleMap,
  courtIds: string[],
  timeSlots: string[],
): Record<string, Record<string, BusyFree>> {
  const grid: Record<string, Record<string, BusyFree>> = {}

  for (const courtId of courtIds) {
    grid[courtId] = {}
    const courtSchedule = schedule[courtId] || {}
    for (const time of timeSlots) {
      grid[courtId][time] = isCellBusy(courtSchedule[time]) ? 'busy' : 'free'
    }
  }

  return grid
}

// buildCourtSchedule çıktısını, her hücrenin TÜRÜNÜ taşıyan ızgaraya çevirir:
// courtId -> timeSlot -> CellKind. Boş hücreler 'free'; dolu hücreler occupied
// slot nesnesinin türüne göre group-lesson / private-lesson / reservation olur.
//
// Not: maintenance/closed gibi string durumlar da DOLU sayılır ama bir
// rezervasyon türü olmadığından 'reservation' (mor) olarak gösterilir; öğrenci
// için yine "rezerve edilemez" anlamına gelir (isCellBusy ile tutarlı).
export function buildCellKindGrid(
  schedule: CourtScheduleMap,
  courtIds: string[],
  timeSlots: string[],
  isGroupMembership?: IsGroupMembership,
): Record<string, Record<string, CellKind>> {
  const grid: Record<string, Record<string, CellKind>> = {}

  for (const courtId of courtIds) {
    grid[courtId] = {}
    const courtSchedule = schedule[courtId] || {}
    for (const time of timeSlots) {
      const slot = courtSchedule[time]
      if (!isCellBusy(slot)) {
        grid[courtId][time] = 'free'
        continue
      }
      // Dolu: occupied nesnesinden türü çıkar. Nesne değilse (maintenance/closed
      // string'i) tür bilinmez → 'reservation' (mor) varsayılır. membershipType
      // resolver'ı grup/özel ayrımını doğru yapmak için aktarılır.
      grid[courtId][time] =
        typeof slot === 'object'
          ? classifyReservationKind(slot as RawReservationDoc, isGroupMembership)
          : 'reservation'
    }
  }

  return grid
}

// Belirli bir günde verilen ızgarada dolu olan slot sayısı (ay görünümü özeti
// için). grid burada tek bir güne ait courtId -> time -> BusyFree haritasıdır.
export function countBusyCells(
  grid: Record<string, Record<string, BusyFree>>,
): number {
  let count = 0
  for (const courtId of Object.keys(grid)) {
    for (const time of Object.keys(grid[courtId])) {
      if (grid[courtId][time] === 'busy') count++
    }
  }
  return count
}
