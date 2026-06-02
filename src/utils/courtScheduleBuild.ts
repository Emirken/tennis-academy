// Kort Durumu (/courts) ekranındaki günlük kort programını oluşturur.
//
// SORUN: Eskiden Courts.vue önce kaydedilmiş `courtSchedule` snapshot
// dokümanını taban alıyor, canlı `reservations` kayıtlarını yalnızca slot
// "available" ise üzerine yazıyordu. Snapshot bayatladığında (ör. bir grup
// dersi silinip yerine kort kiralaması yapıldığında) eski grup etiketi
// ("Yetişkin Grup - ...") slotta takılı kalıyor; /admin/calendar ise canlı
// rezervasyonlardan okuduğu için doğru ("Ayda İleri") gösteriyordu.
//
// ÇÖZÜM: Doluluk için TEK doğru kaynak canlı `reservations` koleksiyonudur
// (AdminCalendar ile aynı). Kaydedilmiş snapshot yalnızca:
//   - admin'in elle koyduğu `maintenance` / `closed` durumları için, ve
//   - canlı rezervasyonun kapsamadığı slotlarda grup dersi yedeği için
// kullanılır. Snapshot'taki `occupied` asla canlı veriyi ezmez.

import {
  isOrphanGroupReservation,
  getReservationGroupId,
  isSlotBlockingReservation,
  type RawReservationDoc,
} from './dailyReservationLimit'

// Bir slotun durumu: ya basit bir string ('available' | 'maintenance' |
// 'closed') ya da dolu slotlar için detay taşıyan nesne.
export interface OccupiedSlot {
  status: 'occupied'
  studentId?: string
  studentFirstName?: string
  studentLastName?: string
  studentFullName?: string
  groupAssignment?: string
  groupName?: string
  membershipType?: string
  reservationType?: string
  // İptal için: bu slotu dolduran rezervasyon dokümanının id'si, zamanı ve
  // HAM (Firestore) kort id'si. Canlı rezervasyondan gelen slotlarda dolu olur;
  // snapshot yedeğinde boştur. rawCourtId, grup üyelerini eşlerken ekran id'si
  // (K1) yerine ham id (court-1) ile kıyaslama yapmak için tutulur.
  reservationId?: string
  startTime?: string
  endTime?: string
  rawCourtId?: string
}

export type SlotValue = string | OccupiedSlot | Record<string, unknown>

// courtId -> time -> SlotValue
export type CourtScheduleMap = Record<string, Record<string, SlotValue>>

// Snapshot'tan korunan admin durumları. Bunlar `reservations`'ta temsil
// edilmediği için canlı veride yoktur; snapshot'tan taşınmaları gerekir.
const ADMIN_SLOT_STATES = new Set(['maintenance', 'closed'])

export interface BuildCourtScheduleInput {
  /** İlgilenilen kort id'leri (snapshot/canlı id'ler bunlara eşlenir). */
  courtIds: string[]
  /** Gösterilecek saat dilimleri (ör. '08:00' ... '22:00'). */
  timeSlots: string[]
  /** Kaydedilmiş courtSchedule.schedule dokümanı (yoksa boş nesne). */
  storedSchedule: CourtScheduleMap
  /** O güne ait canlı rezervasyon dokümanları (ham Firestore verisi). */
  reservations: RawReservationDoc[]
  /** Hâlâ var olan grup id'leri (yetim/hayalet kayıtları elemek için). */
  existingGroupIds: Set<string>
  /** Firestore courtId'sini ekran id'sine eşler (court-1 -> K1 vb.). */
  mapCourtId: (courtId: string) => string
  /** groupId -> grup adı (etiket için; yoksa boş bırakılır). */
  groupNames?: Record<string, string>
  /**
   * "Birebir admin takvimi" modu. AdminCalendar doluluğu YALNIZCA canlı
   * `reservations`'tan kurar; `courtSchedule` snapshot'ını (maintenance/closed
   * ve grup yedeği) HİÇ okumaz ve iptal olmayan her rezervasyonu dolu sayar.
   * Bu bayrak açıkken build da aynısını yapar:
   *   - snapshot tamamen yok sayılır (admin/maintenance/closed taşınmaz, grup
   *     yedeği uygulanmaz),
   *   - bloke kriteri AdminCalendar ile aynıdır: `cancelled` dışındaki her
   *     rezervasyon DOLU (completed/no_show dahil).
   * Öğrenci takvimi bunu kullanır; /courts ve rezervasyon formu KULLANMAZ
   * (onlar isSlotBlockingReservation + snapshot davranışını korur).
   */
  adminParity?: boolean
}

// AdminCalendar'ın slot bloke kriteri: iptal edilen rezervasyonlar gizlenir,
// geri kalan her rezervasyon (completed/no_show dahil) takvimde görünür → dolu.
// isSlotBlockingReservation'dan farkı: completed/no_show'u da DOLU sayar.
const isAdminVisibleReservation = (doc: RawReservationDoc): boolean => {
  return doc.status !== 'cancelled'
}

const getSlotStatusValue = (slotData: SlotValue | undefined): string => {
  if (!slotData) return 'available'
  if (typeof slotData === 'string') return slotData
  if (typeof slotData === 'object') return (slotData as { status?: string }).status || 'available'
  return 'available'
}

// Rezervasyonun kapsadığı tüm saat dilimlerini döndürür (startTime dahil,
// endTime hariç). endTime yoksa yalnızca startTime kabul edilir.
const slotsInRange = (
  timeSlots: string[],
  startTime: string | undefined,
  endTime: string | undefined,
): string[] => {
  if (!startTime) return []
  const startH = parseInt(startTime.split(':')[0], 10)
  if (Number.isNaN(startH)) return []

  const endH = endTime ? parseInt(endTime.split(':')[0], 10) : NaN
  // Geçerli bir bitiş yoksa tek slotluk rezervasyon say.
  const effectiveEndH = Number.isNaN(endH) || endH <= startH ? startH + 1 : endH

  return timeSlots.filter((slot) => {
    const slotH = parseInt(slot.split(':')[0], 10)
    return slotH >= startH && slotH < effectiveEndH
  })
}

const isGroupLessonDoc = (doc: RawReservationDoc): boolean => {
  return (
    doc.reservationType === 'group-lesson' ||
    (typeof doc.membershipType === 'string' && doc.membershipType.includes('_group_')) ||
    !!doc.groupId ||
    !!doc.groupAssignment ||
    doc.groupSchedule === true
  )
}

/**
 * Kort programını canlı rezervasyonları doğru kaynak alarak oluşturur.
 *
 * Öncelik sırası (yüksekten düşüğe):
 *  1. Canlı rezervasyon (occupied) — daima kazanır.
 *  2. Admin durumu (maintenance/closed) — canlı rezervasyon yoksa.
 *  3. Snapshot'taki grup dersi — slot hâlâ available ise yedek.
 *  4. available — varsayılan.
 */
export function buildCourtSchedule(input: BuildCourtScheduleInput): CourtScheduleMap {
  const { courtIds, timeSlots, storedSchedule, reservations, existingGroupIds, mapCourtId } = input
  const groupNames = input.groupNames || {}
  const adminParity = input.adminParity === true

  // 1) Tabanı kur: her slot 'available'. Snapshot'tan SADECE admin durumlarını
  //    (maintenance/closed) taşı — bayat 'occupied' asla taşınmaz.
  //    adminParity modunda snapshot HİÇ okunmaz (AdminCalendar gibi yalnızca
  //    canlı rezervasyonlar): taban tamamen 'available' olur.
  const result: CourtScheduleMap = {}
  for (const courtId of courtIds) {
    result[courtId] = {}
    const stored = storedSchedule[courtId] || {}
    for (const time of timeSlots) {
      if (adminParity) {
        result[courtId][time] = 'available'
        continue
      }
      const status = getSlotStatusValue(stored[time])
      result[courtId][time] = ADMIN_SLOT_STATES.has(status) ? status : 'available'
    }
  }

  // 2) Canlı rezervasyonları işle — doluluğun tek doğru kaynağı.
  for (const res of reservations) {
    // Slotu meşgul etmeyen kayıtları atla. Varsayılan kriter tüm modüllerle
    // ORTAK (isSlotBlockingReservation: cancelled/completed/no_show boş).
    // adminParity modunda ise AdminCalendar ile birebir: yalnızca 'cancelled'
    // gizlenir, completed/no_show dahil her şey DOLU sayılır.
    const blocks = adminParity ? isAdminVisibleReservation(res) : isSlotBlockingReservation(res)
    if (!blocks) continue
    // Grubu silinmiş hayalet/yetim rezervasyonları yok say (AdminCalendar gibi).
    if (isOrphanGroupReservation(res, existingGroupIds)) continue

    const courtId = mapCourtId(res.courtId as string)
    if (!result[courtId]) continue

    const isGroup = isGroupLessonDoc(res)
    const groupId = getReservationGroupId(res) || ''
    const studentName = (res.studentName as string) || (res.studentFullName as string) || ''
    const nameParts = studentName.split(' ')

    const occupied: OccupiedSlot = {
      status: 'occupied',
      studentId: res.studentId,
      studentFirstName: (res.studentFirstName as string) || nameParts[0] || '',
      studentLastName: (res.studentLastName as string) || nameParts.slice(1).join(' ') || '',
      studentFullName: studentName,
      groupAssignment: isGroup ? groupId : '',
      groupName: isGroup ? (groupNames[groupId] || (res.groupName as string) || '') : '',
      membershipType: (res.membershipType as string) || '',
      reservationType: (res.reservationType as string) || (res.type as string) || 'lesson',
      reservationId: (res.id as string) || undefined,
      startTime: (res.startTime as string) || undefined,
      endTime: (res.endTime as string) || undefined,
      rawCourtId: (res.courtId as string) || undefined,
    }

    const slots = slotsInRange(timeSlots, res.startTime as string, res.endTime as string)
    for (const time of slots) {
      // Admin maintenance/closed slotlarını canlı rezervasyon EZER mi? Hayır —
      // bakım/kapalı bilinçli bir admin kararıdır, korunur. Sadece available
      // ve daha önce yerleştirilmiş occupied (çakışan rezervasyon) üzerine yaz.
      const current = getSlotStatusValue(result[courtId][time])
      if (ADMIN_SLOT_STATES.has(current)) continue
      result[courtId][time] = occupied
    }
  }

  // 3) Snapshot grup dersi yedeği: canlı rezervasyonun bırakmadığı (hâlâ
  //    available) slotlarda, snapshot bir grup dersi tutuyorsa onu göster.
  //    Yetim grupları burada da ele.
  //    adminParity modunda snapshot tamamen yok sayıldığı için bu adım atlanır.
  if (adminParity) return result
  for (const courtId of courtIds) {
    const stored = storedSchedule[courtId]
    if (!stored) continue
    for (const time of timeSlots) {
      if (getSlotStatusValue(result[courtId][time]) !== 'available') continue
      const slotData = stored[time]
      if (!slotData || typeof slotData !== 'object') continue
      const status = getSlotStatusValue(slotData)
      if (status !== 'occupied') continue

      const asDoc = slotData as RawReservationDoc
      const isGroup =
        (slotData as { reservationType?: string }).reservationType === 'group-lesson' ||
        !!(slotData as { groupAssignment?: string }).groupAssignment
      if (!isGroup) continue
      // Grubu silinmişse gösterme.
      if (isOrphanGroupReservation(asDoc, existingGroupIds)) continue

      result[courtId][time] = slotData
    }
  }

  return result
}
